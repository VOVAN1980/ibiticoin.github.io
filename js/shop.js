// js/shop.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";
import { buyIBITI, getSaleContract } from "./sale.js";
import {
  connectWallet,
  selectedAccount,
  showIbitiBalance,
  signer           // ← нужен для работы с USDT
} from "./wallet.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";

/* ---------- 1. Контракты только-для-чтения ---------- */
const rpcProvider     = new ethers.JsonRpcProvider(config.active.rpcUrl);
const readSaleContract = new ethers.Contract(
  config.active.contracts.PHASED_TOKENSALE,
  PhasedTokenSaleAbi,
  rpcProvider
);
const ibitiTokenRead = new ethers.Contract(
  config.active.contracts.IBITI_TOKEN,
  ibitiTokenAbi,
  rpcProvider
);

/* ---------- 2. Загрузка статистики продажи ---------- */
async function loadSaleStats() {
  // если на странице нет #cap, значит это не shop-страница → тихо выходим
  const capEl = document.getElementById("cap");
  if (!capEl) return;

  const refReserveEl = document.getElementById("refReserve");
  const salePoolEl   = document.getElementById("salePool");
  const soldEl       = document.getElementById("sold");
  const leftEl       = document.getElementById("left");
  const bonusPoolEl  = document.getElementById("bonusPool");
  const progressEl   = document.getElementById("salesProgress");
  const percentEl    = document.getElementById("soldPercent");
  const lastUpdEl    = document.getElementById("lastUpdated");

  const saleContract = getSaleContract() || readSaleContract;
  if (!saleContract) return;

  try {
    /* 1) баланс контракта */
    const saleAddr  = config.active.contracts.PHASED_TOKENSALE;
    const depositBN = await ibitiTokenRead.balanceOf(saleAddr).catch(() => 0n);
    const cap       = Number(ethers.formatUnits(depositBN, 8));

    /* 2) продано по фазам */
    let soldBN = 0n;
    for (let i = 0; i < 3; i++) {
      const p = await saleContract.phases(i);
      soldBN += BigInt(p.sold);
    }
    const sold = Number(ethers.formatUnits(soldBN, 8));

    /* 3) резервы ────────────────────────────────────────── */
// реферальный резерв
const refReserveBN  = await saleContract.rewardTokens();
const refReserveNum = Number(ethers.formatUnits(refReserveBN, 8));

// пул 10-процентного бонуса
let bonusReserve = 0;
try {
  const bonusBN = await saleContract.volReserve();
  bonusReserve  = Number(ethers.formatUnits(bonusBN, 8));
} catch (e) {
  console.warn("Не удалось получить volReserve:", e);
}

/* 4) пул, остаток, процент */
const salePool = cap - refReserveNum - bonusReserve;
const left     = salePool - sold;
const pct      = salePool > 0 ? (sold / salePool) * 100 : 0;
const fmt      = n => n.toLocaleString("ru-RU",
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* 5) вывод в DOM */
capEl.textContent        = fmt(cap);
refReserveEl.textContent = fmt(refReserveNum);
salePoolEl.textContent   = fmt(salePool);
soldEl.textContent       = fmt(sold);
leftEl.textContent       = fmt(left);
bonusPoolEl.textContent  = fmt(bonusReserve);

progressEl.style.width = `${Math.min(Math.max(pct, 0), 100)}%`;
percentEl.textContent  = `${pct.toFixed(2)}%`;
lastUpdEl.textContent  = `Обновлено: ${new Date().toLocaleTimeString("ru-RU")}`;
} catch (e) {
    console.warn("Ошибка loadReferralStats:", e);
  }
}

async function loadReferralStats(account) {
  const refCountEl = document.getElementById("refCount");   // друзья
  const bonusEl    = document.getElementById("refReward");  // объём-бонусы
  const block      = document.getElementById("referralStats");
  if (!refCountEl || !bonusEl || !block) return;

  const sale = getSaleContract();
  if (!sale) return;

  try {
    // 1) сколько друзей (1 IBI = 1 друг)
    const refTokBN = await sale.referralRewards(account);
    const friends  = Number(ethers.formatUnits(refTokBN, 8));
    refCountEl.textContent = friends.toString();

    // 2) суммируем объём-бонусы из Bought(account) — чанками
    const latest = await rpcProvider.getBlockNumber();
    const DEPLOY = Number(config.active?.saleDeployBlock ?? 0);

    let evts = [];
    if (DEPLOY > 0) {
      const STEP = 100_000; // 50–200k норм
      for (let from = DEPLOY; from <= latest; from += STEP) {
        const to = Math.min(from + STEP - 1, latest);
        const chunk = await readSaleContract.queryFilter(
          readSaleContract.filters.Bought(account),
          from,
          to
        );
        if (chunk?.length) evts.push(...chunk);
      }
    } else {
      const LOOKBACK = 250_000;
      const from = Math.max(0, latest - LOOKBACK);
      evts = await readSaleContract.queryFilter(
        readSaleContract.filters.Bought(account),
        from,
        latest
      );
    }

    const volBN = evts.reduce((sum, ev) => {
      const add = ev?.args?.bonusIBITI ?? 0n;
      return sum + BigInt(add);
    }, 0n);

    bonusEl.textContent = Number(ethers.formatUnits(volBN, 8)).toFixed(2);
    block.style.display = "block";
  } catch (e) {
    console.warn("Ошибка loadSaleStats:", e);
  }
}

/* проверяем, может ли текущий акк видеть панель-рефералку */
async function loadReferralData() {
  if (!selectedAccount) return;
  await loadReferralStats(selectedAccount);
}

/* ---------- 4. UI-утилиты ---------- */
function showDappBrowserNotice() {
  Swal.fire({
    icon: "info",
    title: "Откройте в кошельке",
    html: `Для покупок используйте встроенный браузер кошелька:<br>
          <strong>MetaMask</strong>, <strong>Trust Wallet</strong> или
          <strong>Coinbase Wallet</strong>.`,
    confirmButtonText: "Понятно",
    allowOutsideClick: false
  });
}

/* ---------- 5. Модалка покупки ---------- */
let currentProduct = null;

window.openPurchaseModal = async product => {
  currentProduct = product;

  if (!selectedAccount) {
    try { await connectWallet(); }
    catch (err) { return console.warn("connectWallet:", err); }
  }

  if (product === "NFT") {
    window.location.href = "nft.html";
    return;
  }

  document.getElementById("purchaseTitle").textContent = "Покупка " + product;
  document.getElementById("purchaseModal").style.display = "block";
};

window.closePurchaseModal = () => {
  document.getElementById("purchaseModal").style.display = "none";
  document.getElementById("nftAmount").value = "";
};

/* ---------- Константы старта ---------- */
const SALE_START_TS   = Date.parse("2025-07-01T09:00:00Z"); // 09:00 UTC
const SALE_START_TEXT = "Старт 1 июля в 09:00 UTC (12:00 Киев)";

const IS_LOCAL = config.active.networkName === "Localhost";

/* ---------- 6. Покупка ---------- */
async function handlePurchase(amount, product) {
  /* 0) Продажа ещё не началась — сообщаем и выходим (только вне локалки) */
  if (!IS_LOCAL && Date.now() < SALE_START_TS) {
    return Swal.fire({
      icon:  "info",
      title: "📅 Продажа не началась",
      text:  SALE_START_TEXT,
      confirmButtonText: "Ок"
    });
  }

  /* 6.1 MetaMask */
  if (!window.ethereum) {
    return Swal.fire({
      icon: "warning",
      title: "MetaMask не найден",
      text:  "Установите MetaMask для выполнения покупки."
    });
  }

  /* 6.2 Лоадер */
  Swal.fire({
    title: "Ожидание подтверждения…",
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false
  });

  try {
    const amountUnits  = ethers.parseUnits(amount.toString(), 8);
    const paymentToken = document.getElementById("paymentToken")?.value;

    if (product !== "IBITIcoin" || paymentToken !== "USDT") {
      throw new Error("Оплата через BNB временно отключена.");
    }

    /* баланс USDT — проверяем только после даты старта */
    const usdt    = new ethers.Contract(config.active.contracts.USDT_TOKEN, ibitiTokenAbi, signer);
    const balance = await usdt.balanceOf(selectedAccount);
    if (balance < amountUnits) throw new Error("Недостаточно USDT.");

    /* Транзакция */
    const ref = localStorage.getItem("referrer") || ethers.ZeroAddress;
    const tx  = await buyIBITI(amountUnits, ref);
    await tx.wait();

    await showIbitiBalance(true);

    /* ≥10 IBITI → активируем рефералку */
    if (+amount >= 10) {
  localStorage.setItem(`referralUnlocked_${selectedAccount}`, "1");
  await loadReferralStats(selectedAccount);

  const link = `${location.origin}${location.pathname}?ref=${selectedAccount}`;
  await Swal.fire({
    icon: "info",
    title: "Ваша реферальная ссылка",
    html:  `<a href="${link}" target="_blank">${link}</a><br>Скопируйте и поделитесь.`,
    confirmButtonText: "Скопировать",
    preConfirm: () => navigator.clipboard.writeText(link)
  });

  window.enableReferralAfterPurchase?.(selectedAccount);
}

// Вынеси обновление бонусов после окна "Покупка успешна!" сюда!
await Swal.fire({
  icon: "success",
  title: "Покупка успешна!",
  timer: 3000,
  showConfirmButton: false
});

setTimeout(() => loadReferralStats(selectedAccount), 1500);

  /* ---------- ТВОЙ желаемый catch-блок ---------- */
  } catch (error) {
    console.warn("Ошибка при покупке:", error);

    let rawReason = error?.revert?.args?.[0]
      || error?.shortMessage
      || error?.message
      || "Неизвестная ошибка";

    if (typeof rawReason === "string" && rawReason.startsWith("Error:")) {
      rawReason = rawReason.replace(/^Error:\s*/, "");
    }

    const reason = rawReason === "not started"
      ? "📅 Продажа начнётся: 1 июля в 09:00 UTC"
      : rawReason;

    Swal.fire({
      icon: "error",
      title: "Ошибка",
      text:  reason,
      confirmButtonText: "Ок"
    });
  }
}

window.handlePurchase = handlePurchase;

/* ---------- 7. DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", () => {
  /* 7.1 сохраняем ?ref=… */
  const ref = new URLSearchParams(location.search).get("ref");
  if (ref && ethers.isAddress(ref)) localStorage.setItem("referrer", ref);

  /* 7.2 первичная загрузка */
  loadSaleStats();
  loadReferralData();

  // таймер нужен только на страницах, где есть #cap
  if (document.getElementById("cap")) {
    setInterval(loadSaleStats, 30_000);
  }
  document.getElementById("refreshStats")?.addEventListener("click", loadSaleStats);

  /* 7.3 форма покупки */
  document.getElementById("purchaseForm")?.addEventListener("submit", async ev => {
    ev.preventDefault();
    if (!selectedAccount) {
      return Swal.fire({ icon: "warning", title: "Кошелек не подключен", text: "Сначала подключите кошелек." });
    }
    const amount = document.getElementById("nftAmount").value;
    window.closePurchaseModal();
    await handlePurchase(amount, currentProduct);
    loadSaleStats();
  });

  /* 7.4 включаем / выключаем кнопку «Купить» в модалке */
  const paymentSel = document.getElementById("paymentToken");
  const confirmBtn = document.getElementById("confirmBtn");
  paymentSel?.addEventListener("change", () => {
    if (confirmBtn) confirmBtn.disabled = !paymentSel.value;
  });

  /* 7.5 таймер до старта продаж */
  const countdownEl = document.getElementById("countdownNotice");
  if (countdownEl) {
    const saleStart = new Date("2025-07-01T09:00:00Z").getTime();
    const int = setInterval(() => {
      const diff = saleStart - Date.now();
      if (diff <= 0) {
        countdownEl.textContent = "🟢 Продажа активна!";
        return clearInterval(int);
      }
      const d = Math.floor(diff / 864e5);
      const h = Math.floor((diff / 36e5) % 24);
      const m = Math.floor((diff / 6e4) % 60);
      const s = Math.floor((diff / 1e3) % 60);
      countdownEl.textContent = `⏳ Продажа начнётся через: ${d}д ${h}ч ${m}м ${s}с`;
    }, 1000);
  }

  /* 7.6 подключение кошелька через модалку */
  const walletModal = document.getElementById("walletModal");
  const openBtn     = document.getElementById("openWalletModal");
  const closeBtn    = document.getElementById("closeWalletModal");
  const btnInj      = document.getElementById("btnInjected");
  const btnCb       = document.getElementById("btnCoinbase");

  openBtn?.addEventListener("click", e => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && !window.ethereum) {
      e.preventDefault();
      return showDappBrowserNotice();
    }
    walletModal.style.display = "flex";
  });
  closeBtn?.addEventListener("click", () => (walletModal.style.display = "none"));
  walletModal?.addEventListener("click", e => {
    if (e.target === walletModal) walletModal.style.display = "none";
  });

  btnInj?.addEventListener("click", async () => {
    walletModal.style.display = "none";
    await window.connectWallet?.();
    loadReferralData();
  });
  btnCb?.addEventListener("click", async () => {
    walletModal.style.display = "none";
    await window.connectViaCoinbase?.();
    loadReferralData();
  });

  /* 7.7 проверка владельца реф-ссылки */
  const storedOwner = localStorage.getItem("referralOwner");
  if (storedOwner && selectedAccount && selectedAccount !== storedOwner) {
    localStorage.removeItem("referralOwner");
  }
});

console.log("✅ shop.js загружен");









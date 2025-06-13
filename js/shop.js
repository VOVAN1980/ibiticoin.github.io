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
  const capEl        = document.getElementById("cap");
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
    const saleAddr = config.active.contracts.PHASED_TOKENSALE;
    // 1) Общий баланс контракта (с защитой от ошибок)
    let depositBN;
    try {
      depositBN = await ibitiTokenRead.balanceOf(saleAddr);
    } catch (e) {
      console.warn("Не удалось получить баланс IBITI у контракта продаж:", e);
      depositBN = 0n;
    }
    const cap = Number(ethers.formatUnits(depositBN, 8));

    // 2) Сколько уже продано по всем фазам
    const PHASE_COUNT = 3;
    let soldBN = 0n;
    for (let i = 0; i < PHASE_COUNT; i++) {
      const p = await saleContract.phases(i);
      soldBN += BigInt(p.sold.toString());
    }
    const sold = Number(ethers.formatUnits(soldBN, 8));

    // 3) Резерв рефералов
    const refBN = await saleContract.rewardTokens();
    const refReserve = Number(ethers.formatUnits(refBN, 8));

    // 4) Пул бонусов
    let bonusReserve;
    try {
      const bonusBN = await saleContract.rewardReserve();
      bonusReserve = Number(ethers.formatUnits(bonusBN, 8));
    } catch {
      bonusReserve = 500_000;
    }

    // 5) Основной пул и остаток
    const salePool = cap - refReserve - bonusReserve;
    const left = salePool - sold;

    // 6) Процент продано
    const percent = salePool > 0 ? (sold / salePool) * 100 : 0;
    const pctClamped = Math.min(Math.max(percent, 0), 100);

    // 7) Формат
    const fmt = x => x.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 8) Вставляем в DOM
    capEl.innerText        = fmt(cap);
    refReserveEl.innerText = fmt(refReserve);
    salePoolEl.innerText   = fmt(salePool);
    soldEl.innerText       = fmt(sold);
    leftEl.innerText       = fmt(left);
    bonusPoolEl.innerText  = fmt(bonusReserve);

    // 9) Прогресс и время
    progressEl.style.width   = ${pctClamped}%;
    percentEl.innerText      = ${pctClamped.toFixed(2)}%;
    lastUpdEl.innerText      = Обновлено: ${new Date().toLocaleTimeString("ru-RU")};
  } catch (e) {
    console.warn("Ошибка загрузки статистики токенсейла:", e);
  }
}

/* ---------- 3. Реферальная статистика ---------- */
async function loadReferralStats(account) {
  const rewardEl   = document.getElementById("refReward");
  const refCountEl = document.getElementById("refCount");
  const block      = document.getElementById("referralStats");
  if (!rewardEl || !refCountEl || !block) return;

  const sale = getSaleContract();
  if (!sale) return;

  try {
    const rawRef = await sale.referralRewards(account);
    refCountEl.textContent = Math.floor(Number(ethers.formatUnits(rawRef, 8)));

    const filter  = readSaleContract.filters.Bought(account);
    const events  = await readSaleContract.queryFilter(filter);
    const bonusBN = events.reduce((a, ev) => a + BigInt(ev.args.bonusIBITI), 0n);
    rewardEl.textContent = Number(ethers.formatUnits(bonusBN, 8)).toFixed(2);

    block.style.display = "block";
  } catch (e) {
    console.warn("Ошибка loadReferralStats:", e);
  }
}

/* проверяем, может ли текущий акк видеть панель-рефералку */
async function loadReferralData() {
  if (!selectedAccount) return;
  const flag = localStorage.getItem(`referralUnlocked_${selectedAccount}`);
  if (flag) await loadReferralStats(selectedAccount);
}

/* ---------- 4. UI-утилиты ---------- */
export function showDappBrowserNotice() {
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

/* ---------- 6. Покупка ---------- */
async function handlePurchase(amount, product) {
  if (!window.ethereum) {
    return Swal.fire({ icon: "warning", title: "MetaMask не найден", text: "Установите MetaMask." });
  }

  Swal.fire({ title: "Ожидание подтверждения…", didOpen: () => Swal.showLoading(), allowOutsideClick: false });

  try {
    /* 6.1 проверка/формат суммы */
    const amountUnits  = ethers.parseUnits(amount.toString(), 8);
    const paymentToken = document.getElementById("paymentToken")?.value;

    if (product !== "IBITIcoin" || paymentToken !== "USDT") {
      throw new Error("Оплата через BNB временно отключена.");
    }

    /* 6.2 баланс USDT */
    const usdt = new ethers.Contract(config.active.contracts.USDT_TOKEN, ibitiTokenAbi, signer);
    const bal  = await usdt.balanceOf(selectedAccount);
    if (bal < amountUnits) throw new Error("Недостаточно USDT.");

    /* 6.3 совершаем транзакцию */
    const ref   = localStorage.getItem("referrer") || ethers.ZeroAddress;
    const tx    = await buyIBITI(amountUnits, ref);
    await tx.wait();

    await showIbitiBalance(true);

    /* 6.4 после покупки ≥10 IBITI — активируем рефералку */
    if (Number(amount) >= 10) {
      localStorage.setItem(`referralUnlocked_${selectedAccount}`, "1");
      await loadReferralStats(selectedAccount);

      const link = `${location.origin}${location.pathname}?ref=${selectedAccount}`;
      await Swal.fire({
        icon: "info",
        title: "Ваша реферальная ссылка",
        html: `<a href="${link}" target="_blank">${link}</a><br>Скопируйте и поделитесь.`,
        confirmButtonText: "Скопировать",
        preConfirm: () => navigator.clipboard.writeText(link)
      });

      window.enableReferralAfterPurchase?.(selectedAccount);
    }

    Swal.fire({ icon: "success", title: "Покупка успешна!", timer: 3000, showConfirmButton: false });
  } catch (err) {
    const raw = err?.message?.replace(/^Error:\s*/, "") || "Неизвестная ошибка";
    const reason = raw === "not started" ? "📅 Продажа начнётся: 1 июля в 09:00 UTC" : raw;

    Swal.fire({ icon: "error", title: "Ошибка", text: reason, confirmButtonText: "Ок" });
    console.warn("handlePurchase:", err);
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

  setInterval(loadSaleStats, 30_000);
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

// js/shop.js — ПОЛНАЯ ЗАМЕНА

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";
import { buyIBITI, getSaleContract } from "./sale.js";
import {
  connectWallet,
  selectedAccount,
  showIbitiBalance,
  signer
} from "./wallet.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";

/* ---------- 0. Провайдеры (fallback) ---------- */
const providers = [
  new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org"),
  new ethers.JsonRpcProvider(config.active.rpcUrl)
];
const rpcProvider = new ethers.FallbackProvider(providers, 1);

/* ---------- 1. Контракты только-для-чтения ---------- */
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

/* ---------- Устойчивый сбор Bought(account) чанками ---------- */
function isBlockRangeError(err) {
  const s1 = (err && err.message) || "";
  const s2 = err?.info?.error?.message || "";
  const s3 = err?.error?.message || "";
  const s4 = typeof err === "string" ? err : "";
  const t = `${s1} ${s2} ${s3} ${s4}`.toLowerCase();
  return t.includes("block range is too large")
      || t.includes("range is too large")
      || t.includes("exceed maximum block range")
      || t.includes("too many results")
      || t.includes("query timeout")
      || t.includes("413");
}

async function fetchBoughtLogsSafe(account, startBlock, endBlock) {
  const logs = [];
  let from = startBlock;
  let step = 20_000;   // стартуем аккуратно
  let minStep = 2_000; // допускаем мелкие окна

  while (from <= endBlock) {
    const to = Math.min(from + step - 1, endBlock);
    try {
      const chunk = await readSaleContract.queryFilter(
        readSaleContract.filters.Bought(account),
        from,
        to
      );
      if (chunk?.length) logs.push(...chunk);
      from = to + 1;
      if (step < 150_000) step = Math.floor(step * 1.25);
    } catch (e) {
      if (isBlockRangeError(e)) {
        if (step <= minStep) {
          minStep = Math.max(500, Math.floor(minStep / 2));
        }
        step = Math.max(minStep, Math.floor(step / 2));
        continue; // повторить с меньшим шагом
      }
      console.warn("fetchBoughtLogsSafe fatal:", e);
      return []; // не валим UI
    }
  }
  return logs;
}

/* ---------- 2. Загрузка статистики продажи ---------- */
async function loadSaleStats() {
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
    const saleAddr  = config.active.contracts.PHASED_TOKENSALE;
    const depositBN = await ibitiTokenRead.balanceOf(saleAddr).catch(() => 0n);
    const cap       = Number(ethers.formatUnits(depositBN, 8));

    let soldBN = 0n;
    for (let i = 0; i < 3; i++) {
      const p = await saleContract.phases(i);
      soldBN += BigInt(p.sold);
    }
    const sold = Number(ethers.formatUnits(soldBN, 8));

    // реферальный резерв
    const refReserveBN  = await saleContract.rewardTokens();
    const refReserveNum = Number(ethers.formatUnits(refReserveBN, 8));

    // пул бонусов 10%
    let bonusReserve = 0;
    try {
      const bonusBN = await saleContract.volReserve();
      bonusReserve  = Number(ethers.formatUnits(bonusBN, 8));
    } catch { /* метод мог отсутствовать в ранних деплоях */ }

    const salePool = cap - refReserveNum - bonusReserve;
    const left     = salePool - sold;
    const pct      = salePool > 0 ? (sold / salePool) * 100 : 0;
    const fmt      = n => n.toLocaleString("ru-RU",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    console.warn("Ошибка loadSaleStats:", e);
  }
}

/* ---------- 3. Реферальная статистика ---------- */
async function loadReferralStats(account) {
  const refCountEl = document.getElementById("refCount");
  const bonusEl    = document.getElementById("refReward");
  const block      = document.getElementById("referralStats");
  if (!refCountEl || !bonusEl || !block) return;

  const sale = getSaleContract() || readSaleContract;
  if (!sale) return;

  try {
    const refTokBN = await sale.referralRewards(account);
    const friends  = Number(ethers.formatUnits(refTokBN, 8));
    refCountEl.textContent = friends.toString();

    const latest       = await rpcProvider.getBlockNumber();
    const MAX_LOOKBACK = 250_000;
    const deployBlock  = Number(config.active?.saleDeployBlock ?? 0);
    const startBlock   = Math.max(deployBlock || 0, latest - MAX_LOOKBACK);

    const evts = await fetchBoughtLogsSafe(account, startBlock, latest);
    const volBN = evts.reduce((sum, ev) => {
      const add = ev?.args?.bonusIBITI ?? 0n;
      return sum + BigInt(add);
    }, 0n);

    bonusEl.textContent = Number(ethers.formatUnits(volBN, 8)).toFixed(2);
    block.style.display = "block";
  } catch (e) {
    console.warn("Ошибка loadReferralStats:", e);
  }
}

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

/* ---------- 6. Покупка ---------- */
const SALE_START_TS   = Date.parse("2025-07-01T09:00:00Z");
const SALE_START_TEXT = "Старт 1 июля в 09:00 UTC (12:00 Киев)";
const IS_LOCAL = config.active.networkName === "Localhost";

async function handlePurchase(amount, product) {
  if (!IS_LOCAL && Date.now() < SALE_START_TS) {
    return Swal.fire({
      icon:  "info",
      title: "📅 Продажа не началась",
      text:  SALE_START_TEXT,
      confirmButtonText: "Ок"
    });
  }
  if (!window.ethereum) {
    return Swal.fire({
      icon: "warning",
      title: "MetaMask не найден",
      text:  "Установите MetaMask для выполнения покупки."
    });
  }

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

    const usdt = new ethers.Contract(
      config.active.contracts.USDT_TOKEN,
      ibitiTokenAbi,
      signer
    );
    const balance = await usdt.balanceOf(selectedAccount);
    if (balance < amountUnits) throw new Error("Недостаточно USDT.");

    const ref = localStorage.getItem("referrer") || ethers.ZeroAddress;
    const tx  = await buyIBITI(amountUnits, ref);
    await tx.wait();

    await showIbitiBalance(true);

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

    await Swal.fire({
      icon: "success",
      title: "Покупка успешна!",
      timer: 3000,
      showConfirmButton: false
    });

    setTimeout(() => loadReferralStats(selectedAccount), 1500);
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

    Swal.fire({ icon: "error", title: "Ошибка", text: reason, confirmButtonText: "Ок" });
  }
}
window.handlePurchase = handlePurchase;

/* ---------- 7. DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // сохраняем ?ref=...
  const ref = new URLSearchParams(location.search).get("ref");
  if (ref && ethers.isAddress(ref)) localStorage.setItem("referrer", ref);

  // первичная загрузка
  loadSaleStats();
  // Примечание: реферал-данные подтянем после подключения кошелька,
  // чтобы не ловить лимиты RPC на старте:
  // loadReferralData();

  if (document.getElementById("cap")) {
    setInterval(loadSaleStats, 30_000);
  }
  document.getElementById("refreshStats")?.addEventListener("click", loadSaleStats);

  // форма покупки
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

  // включаем / выключаем кнопку «Подтвердить»
  const paymentSel = document.getElementById("paymentToken");
  const confirmBtn = document.getElementById("confirmBtn");
  paymentSel?.addEventListener("change", () => {
    if (confirmBtn) confirmBtn.disabled = !paymentSel.value;
  });

  // таймер до старта
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

  // модалка кошелька
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
    await connectWallet();     // важный момент: вызываем импорт напрямую
    loadReferralData();
  });
  btnCb?.addEventListener("click", async () => {
    walletModal.style.display = "none";
    await (window.connectViaCoinbase?.()); // если реализации нет — убери кнопку в HTML
    loadReferralData();
  });

  // проверка владельца реф-ссылки
  const storedOwner = localStorage.getItem("referralOwner");
  if (storedOwner && selectedAccount && selectedAccount !== storedOwner) {
    localStorage.removeItem("referralOwner");
  }
});

console.log("✅ shop.js загружен");

/* ---------- 8. Экспорт некоторых функций в window для inline-скриптов ---------- */
window.loadReferralStats = loadReferralStats;
window.loadReferralData  = loadReferralData;

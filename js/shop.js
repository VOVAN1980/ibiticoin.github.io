// js/shop.js
import config                                    from "./config.js";
import { buyIBITI }                              from "./sale.js";
import { connectWallet, selectedAccount, showIbitiBalance } from "./wallet.js";
import Swal                                      from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";
import { getSaleContract }                       from "./sale.js";
import { PhasedTokenSaleAbi }                    from "./abis/PhasedTokenSaleAbi.js";
import { ibitiTokenAbi }                         from "./abis/ibitiTokenAbi.js";

// Публичный RPC и контракт для чтения данных по IBITI
const rpcProvider      = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
const readSaleContract = new ethers.Contract(
  config.mainnet.contracts.PHASED_TOKENSALE_ADDRESS_MAINNET,
  PhasedTokenSaleAbi,
  rpcProvider
);
const ibitiTokenRead   = new ethers.Contract(
  config.mainnet.contracts.IBITI_TOKEN_ADDRESS_MAINNET,
  ibitiTokenAbi,
  rpcProvider
);

/**
 * Подгружает статистику продаж из контракта (через signer или, если нет, через public RPC).
 */
/**
 * Загружает и отображает:
 * – cap       (баланс на контракте)
 * – refReserve (резерв рефералов)
 * – salePool  (основной пул продаж)
 * – sold      (уже продано)
 * – left      (сколько осталось продаж)
 * – bonusPool (фикс. пул бонусов)
 */
async function loadSaleStats() {
  // 1) Элементы DOM
  const capEl        = document.getElementById("cap");
  const refReserveEl = document.getElementById("refReserve");
  const salePoolEl   = document.getElementById("salePool");
  const soldEl       = document.getElementById("sold");
  const leftEl       = document.getElementById("left");
  const bonusPoolEl  = document.getElementById("bonusPool");
  const progressEl   = document.getElementById("salesProgress");
  const percentEl    = document.getElementById("soldPercent");
  const lastUpdEl    = document.getElementById("lastUpdated");

  // 2) Выбираем контракт (signer или public)
  let saleContract = getSaleContract() || readSaleContract;
  if (!saleContract) return;

  try {
    // 3) Общий баланс на контракте
    const saleAddr  = config.mainnet.contracts.PHASED_TOKENSALE_ADDRESS_MAINNET;
    const depositBN = await ibitiTokenRead.balanceOf(saleAddr);
    const cap       = Number(ethers.formatUnits(depositBN, 8));

    // 4) Сколько уже продано (через фазы)
    const PHASE_COUNT = 3;
    let soldBN = 0n;
    for (let i = 0; i < PHASE_COUNT; i++) {
      const p = await saleContract.phases(i);
      soldBN += BigInt(p.sold.toString());
    }
    // 👉 Для теста: временно подменяем реальное sold на 50% от пула
   // const sold = Number(ethers.formatUnits(soldBN, 8));
   const testSold = (cap - refReserve - bonusReserve) * 0.5; // 50% продано
   const sold = testSold;

    // 5) Резерв рефералов
    const refBN      = await saleContract.rewardTokens();
    const refReserve = Number(ethers.formatUnits(refBN, 8));

    // 6) Фиксированный пул бонусов
    const bonusReserve = 500_000;

    // 7) Основной пул и остаток продаж
    const salePool = cap - refReserve - bonusReserve;
    const left     = salePool - sold;

    // 8) Расчёт процента
    const percent    = salePool > 0 ? (sold / salePool) * 100 : 0;
    const pctClamped = Math.min(Math.max(percent, 0), 100);

    // 9) Форматирование
    const fmt = x => x.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // 10) Вставляем числа
    capEl.innerText        = fmt(cap);
    refReserveEl.innerText = fmt(refReserve);
    salePoolEl.innerText   = fmt(salePool);
    soldEl.innerText       = fmt(sold);
    leftEl.innerText       = fmt(left);
    bonusPoolEl.innerText  = fmt(bonusReserve);

    // 11) Обновляем прогресс-бар
    if (progressEl)  progressEl.style.width   = `${pctClamped}%`;
    if (percentEl)   percentEl.innerText      = `${pctClamped.toFixed(2)}%`;

    // 12) Обновляем метку времени
    if (lastUpdEl)   lastUpdEl.innerText      = `Обновлено: ${new Date().toLocaleTimeString("ru-RU")}`;
  } catch (e) {
    console.warn("Ошибка загрузки статистики токенсейла:", e);
  }
}

console.log("✅ shop.js загружен");

async function loadReferralStats(account) {
  const rewardEl   = document.getElementById("refReward");
  const refCountEl = document.getElementById("refCount");
  const statsBlock = document.getElementById("referralStats");

  // Получаем актуальный экземпляр контракта
  const saleContract = getSaleContract();
  if (!saleContract || !account || !rewardEl || !refCountEl || !statsBlock) return;

  try {
    const raw    = await saleContract.referralRewards(account);
    const reward = Number(ethers.formatUnits(raw, 8));
    const count  = Math.floor(reward); // 1 IBITI = 1 друг

    rewardEl.innerText   = reward.toFixed(2);
    refCountEl.innerText = count;
    statsBlock.style.display = "block";
  } catch (err) {
    console.warn("❌ Ошибка загрузки статистики рефералов:", err);
  }
}

let currentProduct = null;

// Отображаем уведомление для мобильных, если не во встроенном браузере кошелька
export function showDappBrowserNotice() {
  Swal.fire({
    icon:    "info",
    title:   "Откройте в кошельке",
    html:    `
      Для покупок на мобильном устройстве<br>
      используйте встроенный браузер кошелька:<br>
      <strong>MetaMask</strong>, <strong>Trust Wallet</strong><br>
      или <strong>Coinbase Wallet</strong>.
    `,
    confirmButtonText: "Понятно",
    allowOutsideClick: false
  });
}

// Открываем модалку покупки
window.openPurchaseModal = async function(productName) {
  currentProduct = productName;
  if (!selectedAccount) {
    try { await connectWallet(); }
    catch (err) { console.warn("Ошибка подключения кошелька:", err); return; }
  }
  if (productName === "NFT") {
    window.location.href = "nft.html";
    return;
  }
  document.getElementById("purchaseTitle").innerText   = "Покупка " + productName;
  document.getElementById("purchaseModal").style.display = "block";
};

// Закрываем модалку
window.closePurchaseModal = function() {
  document.getElementById("purchaseModal").style.display = "none";
  document.getElementById("nftAmount").value            = "";
};

// Обработка покупки
async function handlePurchase(amount, productName) {
  if (!window.ethereum) {
    return Swal.fire({
      icon:  "warning",
      title: "MetaMask не найден",
      text:  "Установите MetaMask для выполнения покупки."
    });
  }

  Swal.fire({
    title:             "Ожидание подтверждения...",
    html:              "Подтвердите транзакцию в кошельке",
    allowOutsideClick: false,
    didOpen:           () => Swal.showLoading()
  });

  try {
    const decimals        = 8;
    const amountFormatted = ethers.parseUnits(amount.toString(), decimals);
    const paymentMethod   = document.getElementById("paymentToken")?.value;
    let tx;

    if (productName === "IBITIcoin") {
      if (paymentMethod === "USDT") {
        const referrer = localStorage.getItem("referrer") || ethers.ZeroAddress;
        tx = await buyIBITI(amountFormatted, referrer);
      } else {
        throw new Error("Оплата через BNB временно отключена.");
      }
    } else {
      throw new Error("Покупка данного продукта не поддерживается.");
    }

    await tx.wait();
    await showIbitiBalance(true);

    Swal.fire({
      icon:               "success",
      title:              "Покупка успешна!",
      text:               "Вы только что приобрели IBITI!",
      timer:              3000,
      showConfirmButton:  false
    });

    // Если купили ≥10, активируем реферальку
    if (Number(amount) >= 10) {
      const yourAddr = selectedAccount;
      const refLink  = `${window.location.origin}${window.location.pathname}?ref=${yourAddr}`;

      await Swal.fire({
        icon:    "info",
        title:   "Ваша реферальная ссылка",
        html:    `<a href="${refLink}" target="_blank">${refLink}</a><br>Скопируйте и поделитесь.`,
        confirmButtonText: "Скопировать",
        preConfirm: () => navigator.clipboard.writeText(refLink)
      });

      if (typeof window.enableReferralAfterPurchase === "function") {
        window.enableReferralAfterPurchase(yourAddr);
      }

      await loadReferralStats(yourAddr);
      localStorage.setItem("referralOwner", yourAddr);
    }

  } catch (error) {
    console.warn("Ошибка при покупке:", error);
    const rawReason = error?.revert?.args?.[0] || error?.shortMessage || error?.message || "Неизвестная ошибка";
    const reason = rawReason === "not started"
                 ? "📅 Продажа начнётся: 1 июля в 09:00 UTC (12:00 Киев)"
                 : rawReason;

    Swal.fire({
      icon:             "error",
      title:            "Ошибка",
      text:             reason,
      confirmButtonText:"Ок"
    });
  }
}
window.handlePurchase = handlePurchase;

document.addEventListener("DOMContentLoaded", () => {
  // 1) сразу при загрузке
  loadSaleStats();

  // 2) потом каждые 30 секунд
  setInterval(loadSaleStats, 30_000);

  // 3) привязываем кнопку «Обновить»
  const btn = document.getElementById("refreshStats");
  if (btn) {
    btn.addEventListener("click", loadSaleStats);
  }

// ждём загрузки DOM, только после этого стартуем initStats
document.addEventListener("DOMContentLoaded", () => {
  initStats();
});

  // 1) Навешиваем форму покупки
  const form = document.getElementById("purchaseForm");
  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const amount = document.getElementById("nftAmount").value;
      if (!selectedAccount) {
        return Swal.fire({
          icon:  "warning",
          title: "Кошелек не подключен",
          text:  "Сначала подключите кошелек."
        });
      }
      closePurchaseModal();
      await handlePurchase(amount, currentProduct);
      loadSaleStats(); // 2) Обновление статистики после покупки
    });
  }

  // Подтвердить кнопку при выборе токена
  const paymentToken = document.getElementById("paymentToken");
  const confirmBtn   = document.getElementById("confirmBtn");
  if (paymentToken && confirmBtn) {
    paymentToken.addEventListener("change", () => {
      confirmBtn.disabled = (paymentToken.value === "");
    });
  }

  // Отсчёт до старта продаж
  const countdownEl = document.getElementById("countdownNotice");
  const saleStart = new Date("2025-07-01T09:00:00Z");
  if (countdownEl) {
    const timer = setInterval(() => {
      const diff = saleStart - Date.now();
      if (diff <= 0) {
        countdownEl.innerText = "🟢 Продажа активна!";
        clearInterval(timer);
        return;
      }
      const days  = Math.floor(diff / (1000*60*60*24));
      const hours = Math.floor((diff / (1000*60*60)) % 24);
      const mins  = Math.floor((diff / (1000*60)) % 60);
      const secs  = Math.floor((diff / 1000) % 60);
      countdownEl.innerText = `⏳ Продажа начнётся через: ${days}д ${hours}ч ${mins}м ${secs}с`;
    }, 1000);
  }

  // Подключить кошелёк
  const connectBtn  = document.getElementById("openWalletModal");
  const walletModal = document.getElementById("walletModal");
  const closeModal  = document.getElementById("closeWalletModal");
  const btnInj      = document.getElementById("btnInjected");
  const btnCb       = document.getElementById("btnCoinbase");

  if (connectBtn) {
    connectBtn.addEventListener("click", e => {
      const isMobile    = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const hasInjected = Boolean(window.ethereum);
      if (isMobile && !hasInjected) {
        e.preventDefault();
        showDappBrowserNotice();
        return;
      }
      walletModal.style.display = "flex";
    });
  }
  if (closeModal) {
    closeModal.addEventListener("click", () => walletModal.style.display = "none");
    walletModal.addEventListener("click", e => {
      if (e.target === walletModal) walletModal.style.display = "none";
    });
  }
  if (btnInj) btnInj.addEventListener("click", () => {
    walletModal.style.display = "none";
    window.connectWallet?.();
  });
  if (btnCb) btnCb.addEventListener("click", () => {
    walletModal.style.display = "none";
    window.connectViaCoinbase?.();
  });

  // Восстанавливаем реферальку
  const stored = localStorage.getItem("referralOwner");
  if (stored && typeof window.enableReferralAfterPurchase === "function") {
    window.enableReferralAfterPurchase(stored);
    loadReferralStats(stored);
  }
});

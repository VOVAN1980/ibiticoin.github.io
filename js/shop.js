// js/shop.js
import { ethers }                                from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config                                    from "./config.js";
import { buyIBITI }                              from "./sale.js";
import { connectWallet, selectedAccount, showIbitiBalance } from "./wallet.js";
import Swal                                      from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";
import { getSaleContract }                       from "./sale.js";
import { PhasedTokenSaleAbi }                    from "./abis/PhasedTokenSaleAbi.js";
import { ibitiTokenAbi }                         from "./abis/ibitiTokenAbi.js";

// Публичный RPC и контракт для чтения данных по IBITI
const rpcProvider = new ethers.JsonRpcProvider(config.active.rpcUrl);

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

  // Получаем контракт (сигнер или публичный)
  const saleContract = getSaleContract() || readSaleContract;
  if (!saleContract) return;

  try {
    const saleAddr = config.active.contracts.PHASED_TOKENSALE;

    // 1) Общий депозит и резерв рефералов
    const [depositBN, refBN] = await Promise.all([
      ibitiTokenRead.balanceOf(saleAddr),
      saleContract.rewardTokens()
    ]);
    const cap        = Number(ethers.formatUnits(depositBN, 8));
    const refReserve = Number(ethers.formatUnits(refBN, 8));

    // 2) Фиксированный пул бонусов
    const bonusReserve = 500_000;

    // 3) Продано по фазам
    const PHASE_COUNT = 3;
    const phasePromises = Array.from({ length: PHASE_COUNT }, (_, i) =>
      saleContract.phases(i)
    );
    const phases = await Promise.all(phasePromises);
    const sold = phases.reduce(
      (sum, p) => sum + Number(ethers.formatUnits(p.sold, 8)),
      0
    );

    // 4) Основной пул и остаток
    const salePool = cap - refReserve - bonusReserve;
    const left     = salePool - sold;

    // 5) Процент продано
    const percent = salePool > 0 ? (sold / salePool) * 100 : 0;
    const pctClamped = Math.min(Math.max(percent, 0), 100);

    // 6) Утилита для форматирования
    const fmt = x =>
      x.toLocaleString("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

    // 7) Вставляем в DOM
    capEl.innerText        = fmt(cap);
    refReserveEl.innerText = fmt(refReserve);
    salePoolEl.innerText   = fmt(salePool);
    soldEl.innerText       = fmt(sold);
    leftEl.innerText       = fmt(left);
    bonusPoolEl.innerText  = fmt(bonusReserve);

    progressEl.style.width = `${pctClamped}%`;
    percentEl.innerText    = `${pctClamped.toFixed(2)}%`;
    lastUpdEl.innerText    = `Обновлено: ${new Date().toLocaleTimeString("ru-RU")}`;
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

async function loadReferralData() {
  if (!selectedAccount) return;

  // проверяем, купил ли этот адрес ≥10 IBI
  const unlocked = localStorage.getItem(`referralUnlocked_${selectedAccount}`);
  if (!unlocked) return;

  // формируем и подставляем ссылку
  const refLink = `${window.location.origin}${window.location.pathname}?ref=${selectedAccount}`;
  const linkInput = document.getElementById("myReferralLink");
  if (linkInput) linkInput.value = refLink;

  // визуальная активация кнопоккопирования и шаринга
  if (typeof window.enableReferralAfterPurchase === "function") {
    window.enableReferralAfterPurchase(selectedAccount);
  }

  // подгружаем статистику
  await loadReferralStats(selectedAccount);
}

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

  // Показываем спиннер ожидания в модалке
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

    // Выбор метода оплаты
    if (productName === "IBITIcoin") {
      if (paymentMethod === "USDT") {
        // referrer берём из localStorage только для on-chain передачи
        const referrer = localStorage.getItem("referrer") || ethers.ZeroAddress;
        tx = await buyIBITI(amountFormatted, referrer);
      } else {
        throw new Error("Оплата через BNB временно отключена.");
      }
    } else {
      throw new Error("Покупка данного продукта не поддерживается.");
    }

    // Ждём майнинга и обновляем баланс
    await tx.wait();
    await showIbitiBalance(true);

    // Успешная покупка
    Swal.fire({
      icon:               "success",
      title:              "Покупка успешна!",
      text:               `Вы приобрели ${amount} IBITI!`,
      timer:              3000,
      showConfirmButton:  false
    });

    // 1) Обновляем общую статистику
    await loadSaleStats();

    // 2) Подгружаем реферальную секцию on-chain (покажет только если куплено ≥10)
    await loadReferralData();

    // 3) Если это первая покупка ≥10 IBITI, дополнительно показываем модалку со ссылкой
    //    (проверяем on-chain, а не localStorage)
    const saleContract = getSaleContract() || readSaleContract;
    const rawBought = await saleContract.balances(selectedAccount);
    const bought    = Number(ethers.formatUnits(rawBought, 8));
    if (bought >= 10) {
      const link = `${window.location.origin}${window.location.pathname}?ref=${selectedAccount}`;
      await Swal.fire({
        icon:               "info",
        title:              "Ваша реферальная ссылка",
        html:               `<a href="${link}" target="_blank">${link}</a>`,
        confirmButtonText:  "Скопировать",
        preConfirm:         () => navigator.clipboard.writeText(link)
      });
    }

  } catch (error) {
    console.warn("Ошибка при покупке:", error);
    const rawReason = error?.revert?.args?.[0]
                   || error?.shortMessage
                   || error?.message
                   || "Неизвестная ошибка";
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

  // 1.1) и сразу проверяем: может ли пользователь видеть свою реф-ссылку
  void loadReferralData();

  // 2) потом каждые 30 секунд
  setInterval(loadSaleStats, 30_000);

  // 3) кнопка «Обновить»
  const refreshBtn = document.getElementById("refreshStats");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadSaleStats);
  }

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
 btnInj.addEventListener("click", async () => {
  walletModal.style.display = "none";
  await window.connectWallet?.();
  loadReferralData();
});
btnCb.addEventListener("click", async () => {
  walletModal.style.display = "none";
  await window.connectViaCoinbase?.();
  loadReferralData();
});

  // Восстанавливаем реферальку
const stored = localStorage.getItem("referralOwner");
if (stored && selectedAccount && selectedAccount !== stored) {
  localStorage.removeItem("referralOwner");
}

});

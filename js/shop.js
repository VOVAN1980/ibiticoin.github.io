// js/shop.js

import config       from "./config.js";
import { buyIBITI } from "./sale.js";
import { connectWallet, selectedAccount, showIbitiBalance } from "./wallet.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

console.log("✅ shop.js загружен");

/**
 * Показывает уведомление для пользователей, у которых нет встроенного DApp-браузера.
 */
function showDappBrowserNotice() {
  Swal.fire({
    icon: 'info',
    title: 'Пожалуйста, откройте в кошельке',
    html: `
      Для покупок на мобильном устройстве откройте этот сайт через встроенный браузер кошелька:<br>
      <strong>MetaMask</strong>, <strong>Trust Wallet</strong> или <strong>Coinbase Wallet</strong>.
    `,
    confirmButtonText: 'Понятно',
    allowOutsideClick: false
  });
}

let currentProduct = null;

window.openPurchaseModal = async function(productName) {
  // На мобильных без injected-провайдера показываем уведомление
  const isMobile    = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const hasInjected = Boolean(window.ethereum);
  if (isMobile && !hasInjected) {
    showDappBrowserNotice();
    return;
  }

  currentProduct = productName;

  if (!selectedAccount) {
    try {
      await connectWallet();
    } catch (err) {
      console.warn("Ошибка при подключении кошелька:", err);
      return;
    }
  }

  if (productName === "NFT") {
    window.location.href = "nft.html";
    return;
  }

  document.getElementById("purchaseTitle").innerText = "Покупка " + productName;
  document.getElementById("purchaseModal").style.display = "block";
};

window.closePurchaseModal = function() {
  document.getElementById("purchaseModal").style.display = "none";
  document.getElementById("nftAmount").value = "";
};

async function handlePurchase(amount, productName) {
  if (!window.ethereum) {
    Swal.fire({
      icon: 'warning',
      title: 'MetaMask не найден',
      text: 'Установите MetaMask для выполнения покупки.'
    });
    return;
  }

  Swal.fire({
    title: 'Ожидание подтверждения...',
    html: 'Подтвердите транзакцию в кошельке',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const decimals        = 8;
    const amountFormatted = ethers.parseUnits(amount.toString(), decimals);
    const paymentMethod   = document.getElementById("paymentToken").value;
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
      icon: 'success',
      title: 'Покупка успешна!',
      text: 'Вы только что приобрели IBITI!',
      timer: 3000,
      showConfirmButton: false
    });

  } catch (error) {
    console.error("Ошибка при покупке:", error);
    let rawReason = error?.revert?.args?.[0] || error?.shortMessage || error?.message || "Неизвестная ошибка";
    let reason = rawReason === "not started"
      ? "📅 Продажа начнётся: 1 июля в 09:00 UTC"
      : rawReason;

    Swal.fire({
      icon: 'error',
      title: 'Ошибка',
      text: reason,
      confirmButtonText: 'Ок'
    });
  }
}

window.handlePurchase = handlePurchase;

document.addEventListener("DOMContentLoaded", () => {
  // Обработчик формы покупки
  const form = document.getElementById('purchaseForm');
  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const amount = document.getElementById('nftAmount').value;

      if (!selectedAccount) {
        Swal.fire({
          icon: 'warning',
          title: 'Кошелёк не подключён',
          text: 'Сначала подключите кошелёк.'
        });
        return;
      }

      window.closePurchaseModal();
      await handlePurchase(amount, currentProduct);
    });
  }

  // Активируем кнопку подтверждения при выборе токена
  const paymentToken = document.getElementById('paymentToken');
  const confirmBtn   = document.getElementById('confirmBtn');
  if (paymentToken && confirmBtn) {
    paymentToken.addEventListener('change', function() {
      confirmBtn.disabled = (this.value === "");
    });
  }

  // Секция обратного отсчёта
  const countdownEl = document.getElementById("countdownNotice");
  const saleStart   = new Date("2025-07-01T09:00:00Z");
  if (countdownEl) {
    const updateCountdown = () => {
      const now  = new Date();
      const diff = saleStart - now;
      if (diff <= 0) {
        countdownEl.innerText = "🟢 Продажа активна!";
        clearInterval(timer);
        return;
      }
      const days    = Math.floor(diff / (1000*60*60*24));
      const hours   = Math.floor((diff / (1000*60*60)) % 24);
      const minutes = Math.floor((diff / (1000*60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      countdownEl.innerText = `⏳ Продажа начнётся через: ${days}д ${hours}ч ${minutes}м ${seconds}с`;
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
  }
});

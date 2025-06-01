// js/shop.js

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import config       from "./config.js";
import { buyIBITI } from "./sale.js";
import { connectWallet, selectedAccount, showIbitiBalance } from "./wallet.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

console.log("✅ shop.js загружен");

let currentProduct = null;

// Открыть модальное окно покупки или перенаправить в NFT-галерею
window.openPurchaseModal = async function(productName) {
  currentProduct = productName;

  // Если кошелёк не подключён — подключаем
  if (!selectedAccount) {
    try {
      await connectWallet();
    } catch (err) {
      console.warn("Пользователь отказался или возникла ошибка при подключении кошелька:", err);
      return;
    }
  }

  // Если это товар NFT, перенаправляем на nft.html
  if (productName === "NFT") {
    window.location.href = "nft.html";
    return;
  }

  // Иначе (IBITIcoin) показываем модалку
  document.getElementById("purchaseTitle").innerText = "Покупка " + productName;
  document.getElementById("purchaseModal").style.display = "block";
};

window.closePurchaseModal = function() {
  document.getElementById("purchaseModal").style.display = "none";
  document.getElementById("nftAmount").value = "";
};

// Обработчик формы покупки
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
    const paymentMethod   = document.getElementById("paymentToken")?.value;
    let tx;

    if (productName === "IBITIcoin") {
      if (paymentMethod === "USDT") {
        // Берём сохранённого реферера или нулевой адрес
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
    ? "📅 Продажа начнётся: 1 июля в 9:00 UTC"
    : rawReason;

  Swal.fire({
    icon: 'error',
    title: 'Ошибка',
    text: reason,
    confirmButtonText: 'Ок'
  });
 } // <-- вот эта скобка закрывает try/catch
}

window.handlePurchase = handlePurchase;

// Навешиваем логику на форму #purchaseForm и на select #paymentToken
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('purchaseForm');
  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      const amount = document.getElementById('nftAmount').value;

      // Ещё одна проверка: кошелёк подключён?
      if (!selectedAccount) {
        Swal.fire({
          icon: 'warning',
          title: 'Кошелек не подключен',
          text: 'Сначала подключите кошелек.',
        });
        return;
      }

      closePurchaseModal();
      await handlePurchase(amount, currentProduct);
    });
  } else {
    console.error("Форма покупки не найдена");
  }

  const paymentToken = document.getElementById('paymentToken');
  const confirmBtn   = document.getElementById('confirmBtn');
  if (paymentToken && confirmBtn) {
    paymentToken.addEventListener('change', function () {
      confirmBtn.disabled = (this.value === "");
    });
  } else {
    console.error("Элементы paymentToken или confirmBtn не найдены");
  }
});

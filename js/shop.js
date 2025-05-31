// js/shop.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import config       from "./config.js";
import { buyIBITI } from "./sale.js";
import { showIbitiBalance } from "./wallet.js";

// Покупка токенов
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
    // parseUnits в ethers@6:
    const amountFormatted = ethers.parseUnits(amount.toString(), decimals);
    const paymentMethod   = document.getElementById("paymentToken")?.value;
    let tx;

    if (productName === "IBITIcoin") {
      if (paymentMethod === "USDT") {
        // берём сохранённого реферера или взаимозаменяем на нулевой адрес
        const referrer = localStorage.getItem("referrer") || ethers.ZeroAddress;
        tx = await buyIBITI(amountFormatted, referrer);
      } else {
        throw new Error("Оплата через BNB временно отключена.");
      }
    } else {
      throw new Error("Покупка данного продукта не поддерживается.");
    }

    await tx.wait();

    // 🔁 Обновляем баланс
    await showIbitiBalance(true);

    Swal.fire({
      icon: 'success',
      title: 'Покупка успешна!',
      text: 'Ура! Вы стали миллионером!',
      timer: 5000,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Ошибка',
      text: error.message || 'Что-то пошло не так.',
      confirmButtonText: 'Ок'
    });
  }
}

// Экспортируем на window, чтобы кнопки могли вызвать
window.handlePurchase = handlePurchase;

// ----------------------
// Модальное окно
// ----------------------

let currentProduct = null;

function openPurchaseModal(productName) {
  currentProduct = productName;

  if (productName === 'NFT') {
    window.location.href = 'nft.html';
    return;
  }

  document.getElementById('purchaseTitle').innerText = 'Покупка ' + productName;
  document.getElementById('purchaseModal').style.display = 'block';
}

function closePurchaseModal() {
  document.getElementById('purchaseModal').style.display = 'none';
  document.getElementById('nftAmount').value = '';
}

window.openPurchaseModal  = openPurchaseModal;
window.closePurchaseModal = closePurchaseModal;

// ----------------------
// Обработчик формы
// ----------------------

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('purchaseForm');
  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      const amount = document.getElementById('nftAmount').value;

      const walletDisplay = document.getElementById("walletAddress");
      if (!walletDisplay ||
          walletDisplay.innerText.trim() === '' ||
          walletDisplay.innerText.toLowerCase().includes("disconnect")
      ) {
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

  // Навешиваем обработчик на селектор способа оплаты
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

console.log("✅ shop.js загружен");

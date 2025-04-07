// js/shop.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import config from "./config.js";
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";

// Провайдер и signer
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Контракт IBITIcoin
const ibitiContract = new ethers.Contract(
  config.testnet.contracts.IBITI_TOKEN_ADDRESS,
  ibitiTokenAbi,
  signer
);

// Функция покупки токенов
async function handlePurchase(amount, productName) {
  if (!window.ethereum) {
    Swal.fire({
      icon: 'warning',
      title: 'MetaMask не найден',
      text: 'Установите MetaMask для выполнения покупки.',
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
    let tx;
    const decimals = 8;
    const amountFormatted = ethers.utils.parseUnits(amount.toString(), decimals);
    const paymentMethod = document.getElementById("paymentToken")?.value;

    if (productName === "IBITIcoin") {
      if (paymentMethod === "IBITI") {
        tx = await ibitiContract.purchaseCoinBNB({ value: amountFormatted });
      } else if (paymentMethod === "USDT") {
        const usdtAddress = config.testnet.contracts.ERC20_MOCK_ADDRESS;
        tx = await ibitiContract.purchaseCoinToken(usdtAddress, amountFormatted);
      } else {
        throw new Error("Выберите способ оплаты.");
      }
    } else {
      throw new Error("Покупка данного продукта не поддерживается.");
    }

    await tx.wait();

    Swal.fire({
      icon: 'success',
      title: 'Покупка успешна!',
      text: 'Ура!!! вы стали миллионером!',
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

window.handlePurchase = handlePurchase;

// Модальное окно для покупки
let currentProduct = null;
function openPurchaseModal(productName) {
  currentProduct = productName;
  if (productName === 'NFT') {
    window.location.href = 'nft.html';
    return;
  }
  const titleElem = document.getElementById('purchaseTitle');
  if (titleElem) {
    titleElem.innerText = 'Покупка ' + productName;
  }
  const modal = document.getElementById('purchaseModal');
  if (modal) {
    modal.style.display = 'block';
  }
}
function closePurchaseModal() {
  const modal = document.getElementById('purchaseModal');
  if (modal) modal.style.display = 'none';
  const amountInput = document.getElementById('nftAmount');
  if (amountInput) amountInput.value = '';
}
window.openPurchaseModal = openPurchaseModal;
window.closePurchaseModal = closePurchaseModal;

// Обработчики формы и селектора способа оплаты
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('purchaseForm');
  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      const amountElem = document.getElementById('nftAmount');
      const amount = amountElem ? amountElem.value : null;
      const walletDisplay = document.getElementById("walletAddress");
      if (!walletDisplay || walletDisplay.innerText.trim() === '' ||
          walletDisplay.innerText.toLowerCase().includes("disconnect")) {
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
    // Если форма отсутствует, ничего не делаем
  }

  const paymentToken = document.getElementById('paymentToken');
  const confirmBtn = document.getElementById('confirmBtn');
  if (paymentToken && confirmBtn) {
    paymentToken.addEventListener('change', function () {
      confirmBtn.disabled = (this.value === "");
    });
  }
});

console.log("✅ shop.js загружен");

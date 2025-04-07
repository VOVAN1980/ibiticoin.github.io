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

let currentProduct = null;

function openPurchaseModal(productName) {
  currentProduct = productName;
  // Если выбран NFT – переходим на страницу NFT
  if (productName === 'NFT') {
    window.location.href = 'nft.html';
    return;
  }
  const titleElem = document.getElementById('purchaseTitle');
  const modalElem = document.getElementById('purchaseModal');
  if (titleElem && modalElem) {
    titleElem.innerText = 'Покупка ' + productName;
    modalElem.style.display = 'block';
  }
}

function closePurchaseModal() {
  const modalElem = document.getElementById('purchaseModal');
  if (modalElem) {
    modalElem.style.display = 'none';
  }
  const amountInput = document.getElementById('nftAmount');
  if (amountInput) amountInput.value = '';
}

window.openPurchaseModal = openPurchaseModal;
window.closePurchaseModal = closePurchaseModal;

document.addEventListener("DOMContentLoaded", () => {
  // Обработчик формы покупки (если она присутствует)
  const form = document.getElementById('purchaseForm');
  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      const amountInput = document.getElementById('nftAmount');
      if (!amountInput) return;
      const amount = amountInput.value;
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
  }

  // Обработчик для селектора способа оплаты (если элементы существуют)
  const paymentToken = document.getElementById('paymentToken');
  const confirmBtn = document.getElementById('confirmBtn');
  if (paymentToken && confirmBtn) {
    paymentToken.addEventListener('change', function () {
      confirmBtn.disabled = (this.value === "");
    });
  }
});

console.log("✅ shop.js загружен");

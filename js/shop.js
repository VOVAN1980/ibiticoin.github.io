// js/shop.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import config from "./config.js";
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";

// Провайдер и signer
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Контракт IBITIcoin
const ibitiContract = new ethers.Contract(
  config.mainnet.contracts.IBITI_TOKEN_ADDRESS
  ibitiTokenAbi,
  signer
);

// Покупка токенов
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
  if (paymentMethod === "USDT") {
    const usdtAddress = config.mainnet.contracts.ERC20_MOCK_ADDRESS;
    tx = await ibitiContract.purchaseCoinToken(usdtAddress, amountFormatted);
  } else {
    throw new Error("Оплата через BNB временно отключена.");
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

window.openPurchaseModal = openPurchaseModal;
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
      if (!walletDisplay || walletDisplay.innerText.trim() === '' || walletDisplay.innerText.toLowerCase().includes("disconnect")) {
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
});

// ... остальной код вашего shop.js

console.log("✅ shop.js загружен");

// Активация кнопки после выбора способа оплаты (выполняется после полной загрузки DOM)
console.log("✅ shop.js загружен");

// Обработчик формы покупки, навешанный через DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('purchaseForm');
  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      const amount = document.getElementById('nftAmount').value;
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
    console.error("Форма покупки не найдена");
  }

  // Навешиваем обработчик на селектор способа оплаты
  const paymentToken = document.getElementById('paymentToken');
  const confirmBtn = document.getElementById('confirmBtn');
  if (paymentToken && confirmBtn) {
    paymentToken.addEventListener('change', function () {
      confirmBtn.disabled = (this.value === "");
    });
  } else {
    console.error("Элементы paymentToken или confirmBtn не найдены");
  }
});

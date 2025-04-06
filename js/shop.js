import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import config from "./config.js";
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";
import { connectWallet } from "./wallet.js"; // Функция подключения кошелька

// Функция для получения экземпляра контракта IBITIcoin
function getIbitiContract() {
  if (!window.ethereum) {
    console.error("Ethereum объект не найден. Подключите кошелек.");
    return null;
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(
    config.testnet.contracts.IBITI_TOKEN_ADDRESS,
    ibitiTokenAbi,
    signer
  );
}

// Функция покупки токенов
async function handlePurchase(amount, productName) {
  // Проверяем, подключен ли кошелек, используя элемент walletAddress
  const walletDisplay = document.getElementById("walletAddress");
  if (
    !walletDisplay ||
    walletDisplay.innerText.trim() === '' ||
    walletDisplay.innerText.toLowerCase().includes("disconnected")
  ) {
    Swal.fire({
      icon: 'warning',
      title: 'Кошелек не подключен',
      text: 'Пожалуйста, нажмите кнопку «Подключить кошелек».',
    });
    return;
  }
  
  // Показываем индикатор ожидания подтверждения транзакции
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
    
    const ibitiContract = getIbitiContract();
    if (!ibitiContract) {
      throw new Error("Контракт не инициализирован, кошелек не подключен.");
    }

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
      text: 'Ура! Вы приобрели товар.',
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

// Модальное окно покупки
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

// Обработчики формы покупки и выбора способа оплаты
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('purchaseForm');
  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      const amount = document.getElementById('nftAmount').value;

      const walletDisplay = document.getElementById("walletAddress");
      if (
        !walletDisplay ||
        walletDisplay.innerText.trim() === '' ||
        walletDisplay.innerText.toLowerCase().includes("disconnected")
      ) {
        Swal.fire({
          icon: 'warning',
          title: 'Кошелек не подключен',
          text: 'Пожалуйста, нажмите кнопку «Подключить кошелек».',
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
  const confirmBtn = document.getElementById('confirmBtn');
  if (paymentToken && confirmBtn) {
    paymentToken.addEventListener('change', function () {
      confirmBtn.disabled = (this.value === "");
    });
  } else {
    console.error("Элементы paymentToken или confirmBtn не найдены");
  }
});

console.log("✅ shop.js загружен");

// shop.js

import config from "../config.js";
import contractAbi from "./abis/IBITIcoin.js";

// Создаём провайдера и signer через ethers.js
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Контракт токена
const contract = new ethers.Contract(
  config.contracts.IBITI_TOKEN_ADDRESS,
  contractAbi,
  signer
);

// Основная функция покупки токена или NFT
async function handlePurchase(amount, productName) {
  Swal.fire({
    title: 'Ожидание подтверждения...',
    html: 'Пожалуйста, подтвердите транзакцию в кошельке',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    let tx;
    // Пример: если покупается IBITIcoin, используем purchaseCoinToken с USDT
    if (productName === "IBITIcoin") {
      // Адрес USDT, как указан в смарт-контракте на BSC Mainnet:
      const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
      // Здесь amount — количество токенов в базовой единице (учтите, что токен имеет 8 десятичных знаков)
      tx = await contract.purchaseCoinToken(usdtAddress, amount);
    } else {
      // Если потребуется другая логика (например, покупка через BNB), можно добавить:
      // tx = await contract.purchaseCoinBNB({ value: ethers.utils.parseEther(amount.toString()) });
      throw new Error("Покупка данного продукта не поддерживается через данный метод.");
    }
    
    await tx.wait();

    Swal.fire({
      icon: 'success',
      title: 'Покупка успешна!',
      text: 'Вы стали владельцем!',
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

// Экспортируем в глобальную область
window.handlePurchase = handlePurchase;

// ------------------------------
// Модальное окно покупки
// ------------------------------

let currentProduct = null;

function openPurchaseModal(productName) {
  currentProduct = productName;

  // Если покупка NFT, перенаправляем на NFT-галерею
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

// ------------------------------
// Обработчик формы покупки
// ------------------------------

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

console.log("shop.js загружен — готов к работе");

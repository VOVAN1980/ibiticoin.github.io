// shop.js

import config from "../config.js";
import contractAbi from "./abis/IBITIcoin.js";

// Создаем провайдера и подписанта через ethers.js
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Создаем экземпляр контракта, используя адрес из конфигурации
const contract = new ethers.Contract(
  config.contracts.IBITI_TOKEN_ADDRESS,
  contractAbi,
  signer
);

// Функция покупки, принимает количество и название продукта
async function handlePurchase(amount, productName) {
  Swal.fire({
    title: 'Ожидание подтверждения...',
    html: 'Пожалуйста, ожидайте...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    // Вызов метода покупки с передачей параметров
    const tx = await contract.purchase(amount, productName);
    await tx.wait();

    Swal.fire({
      icon: 'success',
      title: 'Ура!',
      text: 'Покупка успешна, ты стал миллионером! 🎉',
      timer: 5000,
      timerProgressBar: true,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Ошибка покупки',
      text: error.message || 'Что-то пошло не так. Попробуйте ещё раз.',
      confirmButtonText: 'Ок'
    });
  }
}

// Навешиваем обработчик клика, если элемент с id "buyBtn" присутствует
const buyBtn = document.getElementById('buyBtn');
if (buyBtn) {
  buyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // Передаем примерные параметры. Измените их по необходимости.
    handlePurchase(1, 'Product');
  });
}

// Экспортируем функцию в глобальное пространство, чтобы можно было вызвать её из HTML
window.handlePurchase = handlePurchase;

console.log("Используемая сеть:", config.networkName);
console.log("RPC URL:", config.rpcUrl);
console.log("Адрес контракта:", config.contracts.IBITI_TOKEN_ADDRESS);

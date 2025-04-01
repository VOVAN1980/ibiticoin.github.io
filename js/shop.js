// shop.js

import config from "../config.js";
import contractAbi from "./abis/IBITIcoin.js";

// Создаём провайдер и signer через ethers.js
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Создаём экземпляр контракта, используя адрес из конфигурации
const contract = new ethers.Contract(
  config.contracts.IBITI_TOKEN_ADDRESS,
  contractAbi,
  signer
);

/**
 * Функция покупки, принимает количество и название продукта.
 * Замените вызов contract.purchase(...) на фактический метод покупки вашего контракта.
 */
async function handlePurchase(amount, productName) {
  // Показываем индикатор загрузки через SweetAlert
  Swal.fire({
    title: 'Ожидание подтверждения...',
    html: 'Пожалуйста, ожидайте...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    // Пример вызова метода покупки. Замените "purchase" и его параметры на реальную логику.
    // Например: const tx = await contract.purchase(amount, productName);
    const tx = await contract.purchase(/* передайте параметры, если нужно */);
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

// Если на странице есть элемент с id "buyBtn", навешиваем обработчик.
const buyBtn = document.getElementById('buyBtn');
if (buyBtn) {
  buyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // Здесь можно задать фиксированное значение или вызвать handlePurchase с параметрами
    handlePurchase(); 
  });
}

// Экспортируем функцию handlePurchase в глобальное пространство, чтобы её можно было вызывать из HTML
window.handlePurchase = handlePurchase;

console.log("Используемая сеть:", config.networkName);
console.log("RPC URL:", config.rpcUrl);
console.log("Адрес контракта:", config.contracts.IBITI_TOKEN_ADDRESS);

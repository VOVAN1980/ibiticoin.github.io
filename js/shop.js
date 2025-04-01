// shop.js

// Импорт конфигурации (адреса, параметры сети и т.д.)
import config from "./config.js";
// Импорт ABI контракта – замените путь и имя файла на актуальные
import contractAbi from "./abis/YourContractABI.json";

// Создаём провайдер и signer через ethers.js
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Создаём экземпляр контракта, используя адрес из конфигурации
const contract = new ethers.Contract(
  config.contracts.IBITI_TOKEN_ADDRESS, // адрес из config.js
  contractAbi,
  signer
);

// Функция покупки
async function handlePurchase() {
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
    // Вызов метода покупки на контракте.
    // Параметры покупки можно указать согласно вашему контракту.
    const tx = await contract.purchase(/* параметры покупки */);
    await tx.wait();
    
    Swal.fire({
      icon: 'success',
      title: 'Ура!',
      text: 'Покупка успешна, ты стал миллионером! 🎉',
      timer: 5000,
      timerProgressBar: true,
      showConfirmButton: false
    });
    
    // Здесь можно добавить обновление UI или редирект
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Ошибка покупки',
      text: error.message || 'Что-то пошло не так. Попробуйте ещё раз.',
      confirmButtonText: 'Ок'
    });
  }
}

// Привязываем обработчик к элементу с id="buyBtn", если он существует
const buyBtn = document.getElementById('buyBtn');
if (buyBtn) {
  buyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handlePurchase();
  });
}

// Экспортируем функцию handlePurchase в глобальное пространство,
// чтобы её можно было вызывать из HTML-страницы
window.handlePurchase = handlePurchase;

console.log("Используемая сеть:", config.networkName);
console.log("RPC URL:", config.rpcUrl);
console.log("Адрес контракта:", config.contracts.IBITI_TOKEN_ADDRESS);

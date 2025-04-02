// Импортируем модуль blockchain.js из папки utils
import { provider, signer, ibitiContract, network } from "./utils/blockchain.js";

console.log("Подключены к сети:", network.networkName);

// Функция для проверки общего предложения токенов
async function checkTotalSupply() {
  try {
    const supply = await ibitiContract.totalSupply();
    console.log("Общее предложение:", supply.toString());
  } catch (err) {
    console.error("Ошибка получения общего предложения:", err);
  }
}
checkTotalSupply();

// Функция для покупки токенов
async function buyTokens() {
  try {
    const amountInput = document.getElementById("buyAmount");
    const amountBNB = amountInput.value;
    if (!amountBNB) {
      alert("Введите сумму для покупки");
      return;
    }
    // Используем ethers, который уже подключен через CDN
    const value = ethers.parseEther(amountBNB);
    const tx = await ibitiContract.purchaseCoinBNB({ value });
    console.log("Транзакция отправлена:", tx.hash);
    await tx.wait();
    console.log("Покупка прошла успешно!");
  } catch (err) {
    console.error("Ошибка покупки токенов:", err);
  }
}

// Привязываем функцию к кнопке покупки, если элемент существует
const buyBtn = document.getElementById("buyBtn");
if (buyBtn) {
  buyBtn.addEventListener("click", (e) => {
    e.preventDefault();
    buyTokens();
  });
} else {
  console.warn("Элемент с id 'buyBtn' не найден.");
}

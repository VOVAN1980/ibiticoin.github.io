// js/main.js

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import { config } from "./config.js";
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";

// Провайдер и signer
const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
const signer = provider.getSigner();

// Контракт токена
const ibitiContract = new ethers.Contract(
  config.testnet.contracts.IBITI_TOKEN_ADDRESS,
  ibitiTokenAbi,
  signer
);

// Лог сетевого подключения
provider.getNetwork().then(network => {
  console.log("Подключены к сети:", network.name);
});

// Получение общего предложения
async function checkTotalSupply() {
  try {
    const supply = await ibitiContract.totalSupply();
    console.log("Общее предложение токенов:", supply.toString());
  } catch (err) {
    console.error("Ошибка получения общего предложения:", err);
  }
}

// Покупка токенов за BNB
async function buyTokens() {
  try {
    const amountInput = document.getElementById("buyAmount");
    const amountBNB = amountInput?.value;
    if (!amountBNB) {
      alert("Введите сумму для покупки");
      return;
    }

    const value = ethers.parseEther(amountBNB);
    const tx = await ibitiContract.purchaseCoinBNB({ value });
    console.log("Транзакция отправлена:", tx.hash);
    await tx.wait();
    console.log("✅ Покупка прошла успешно!");
  } catch (err) {
    console.error("❌ Ошибка при покупке токенов:", err);
  }
}

// Привязка к кнопке
document.addEventListener("DOMContentLoaded", () => {
  const buyBtn = document.getElementById("buyBtn");
  if (buyBtn) {
    buyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      buyTokens();
    });
  } else {
    console.warn("Кнопка #buyBtn не найдена.");
  }

  checkTotalSupply();
});

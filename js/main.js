import { signer, connectWallet } from "./wallet.js";
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";
import { IBITI_TOKEN_ADDRESS } from "./config.js"; // если у тебя адресы вынесены туда

import { Contract, parseEther } from "ethers";

// Контракт токена
const ibitiContract = new Contract(IBITI_TOKEN_ADDRESS, ibitiTokenAbi, signer);

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

    const value = parseEther(amountBNB); // ethers v6
    const tx = await ibitiContract.purchaseCoinBNB({ value });
    console.log("Транзакция отправлена:", tx.hash);
    await tx.wait();
    console.log("✅ Покупка прошла успешно!");
  } catch (err) {
    console.error("❌ Ошибка при покупке токенов:", err);
  }
}

// Привязка к кнопке
document.addEventListener("DOMContentLoaded", async () => {
  await connectWallet();

  const buyBtn = document.getElementById("buyBtn");
  if (buyBtn) {
    buyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      buyTokens();
    });
  }

  checkTotalSupply();
});

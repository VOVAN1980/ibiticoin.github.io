// js/main.js
import { signer, connectWallet } from "./wallet.js";
import { ibitiTokenAbi }         from "./abis/ibitiTokenAbi.js";
import { Contract, parseEther }   from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";

const IBITI_TOKEN_ADDRESS = "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196";
const ibitiContract = new Contract(IBITI_TOKEN_ADDRESS, ibitiTokenAbi, signer);

async function checkTotalSupply() {
  try {
    const supply = await ibitiContract.totalSupply();
    console.log("Общее предложение токенов:", supply.toString());
  } catch (err) {
    console.error("Ошибка получения общего предложения:", err);
  }
}

async function buyTokens() {
  try {
    const amountInput = document.getElementById("buyAmount");
    const amountBNB = amountInput?.value;
    if (!amountBNB) {
      alert("Введите сумму для покупки");
      return;
    }

    const value = parseEther(amountBNB);
    const tx = await ibitiContract.purchaseCoinBNB({ value });
    console.log("Транзакция отправлена:", tx.hash);
    await tx.wait();
    console.log("✅ Покупка прошла успешно!");
  } catch (err) {
    console.error("❌ Ошибка при покупке токенов:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await connectWallet();

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

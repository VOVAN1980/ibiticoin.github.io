import { signer, connectWallet } from "./wallet.js";
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";

const IBITI_TOKEN_ADDRESS = "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196";

const ibitiContract = new ethers.Contract(IBITI_TOKEN_ADDRESS, ibitiTokenAbi, signer);

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

    const value = ethers.utils.parseEther(amountBNB);
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
  await connectWallet(); // подключение кошелька

  const buyBtn = document.getElementById("buyBtn");
  if (buyBtn) {
    buyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      buyTokens();
    });
  }

  checkTotalSupply();
});

import { signer, connectWallet } from "./wallet.js";
import { ibitiTokenAbi }         from "./abis/ibitiTokenAbi.js";
import { Contract, parseEther }   from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";

const IBITI_TOKEN_ADDRESS = "0x5a9afF077690880Ff8A37942bdb2cC521916c7FF";
let ibitiContract = null;

// Вообще не вызываем connectWallet() автоматически,
// а создаем инстанс контракта только после подключения.
async function initContract() {
  if (!signer) return;
  ibitiContract = new Contract(
    IBITI_TOKEN_ADDRESS,
    ibitiTokenAbi,
    signer
  );
}

// Проверка totalSupply
async function checkTotalSupply() {
  try {
    if (!ibitiContract) {
      console.warn("Контракт IBITI ещё не инициализирован");
      return;
    }
    const supply = await ibitiContract.totalSupply();
    console.log("Общее предложение токенов:", supply.toString());
  } catch (err) {
    console.error("Ошибка получения общего предложения:", err);
  }
}

// Функция покупки
async function buyTokens() {
  try {
    if (!signer) {
      alert("Сначала подключите кошелек!");
      return;
    }
    if (!ibitiContract) {
      await initContract();
    }

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

document.addEventListener("DOMContentLoaded", () => {
  // Удалили автоматический вызов connectWallet()
  // await connectWallet();

  // Навешиваем очередь на кнопку “Подключить кошелек” (если она есть в HTML)
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await connectWallet();
      // Инициализируем контракт сразу после подключения
      await initContract();
      // Теперь можно сразу показать totalSupply, если надо
      checkTotalSupply();
    });
  }

  // Навешиваем логику на кнопку “Купить”
  const buyBtn = document.getElementById("buyBtn");
  if (buyBtn) {
    buyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      buyTokens();
    });
  } else {
    console.warn("Кнопка #buyBtn не найдена.");
  }
});


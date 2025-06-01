// js/wallet.js
// ─────────────────────────────────────────────────────────────
// 1) Импорт ethers и Web3Modal (UMD) через глобальный scope
// ─────────────────────────────────────────────────────────────
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";

// Примечание: Web3Modal и WalletConnectProvider подключаются на уровне <script> тегов в HTML.
// Поэтому здесь мы достаём их из window:
const Web3ModalConstructor = window.Web3Modal?.default || window.Web3Modal;
const WalletConnectProviderConstructor = window.WalletConnectProvider?.default || window.WalletConnectProvider;

console.log("✅ wallet.js загружен");

// ─────────────────────────────────────────────────────────────
// 2) Глобальные переменные
// ─────────────────────────────────────────────────────────────
let provider = null;      // ethers BrowserProvider
let signer = null;        // ethers Signer
let selectedAccount = null;

// Приведём адреса и ABI (если нужно)
const INFURA_ID = "1faccf0f1fdc4532ad7a1a38a67ee906";

const IBITI_TOKEN_ADDRESS      = "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196";
const NFTSALEMANAGER_ADDRESS   = "0x5572F3AE84319Fbd6e285a0CB854f92Afd31dd6D";
const NFT_DISCOUNT_ADDRESS     = "0x26C4E3D3E40943D2d569e832A243e329E14ecb02";
const PHASED_TOKENSALE_ADDRESS = "0x3092cFDfF6890F33b3227c3d2740F84772A465c7";

// ABI-контракты (импортируем из файлов)
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";

// ─────────────────────────────────────────────────────────────
// 3) Настройка Web3Modal с кэшированием провайдера
// ─────────────────────────────────────────────────────────────
const providerOptions = {
  walletconnect: {
    package: WalletConnectProviderConstructor,
    options: { infuraId: INFURA_ID }
  }
};

const web3Modal = new Web3ModalConstructor({
  cacheProvider: true,     // ← ВКЛЮЧАЕМ кэш провайдера
  providerOptions
});

// ─────────────────────────────────────────────────────────────
// 4) Функция подключения кошелька
// ─────────────────────────────────────────────────────────────
export async function connectWallet() {
  try {
    // Открываем Web3Modal и получаем rawProvider
    const rawProvider = await web3Modal.connect();
    // Привязываем к ethers (BrowserProvider)
    const web3Provider = new ethers.BrowserProvider(rawProvider);
    signer = await web3Provider.getSigner();
    provider = web3Provider;

    // Получаем адрес (ethers v6: getAddress возвращает строку)
    selectedAccount = await signer.getAddress();

    // Показываем адрес в DOM
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) {
      walletDisplay.innerText = selectedAccount;
    }

    // Подписываемся на события изменения аккаунта / дисконнекта
    rawProvider.on("accountsChanged", async (accounts) => {
      if (!accounts || accounts.length === 0) {
        // если аккаунты пропали — дисконнектим
        await disconnectWallet();
      } else {
        selectedAccount = accounts[0];
        if (walletDisplay) walletDisplay.innerText = selectedAccount;
        // При желании: обновляем баланс
        await showIbitiBalance(true);
      }
    });

    rawProvider.on("disconnect", async () => {
      await disconnectWallet();
    });

    console.log("✅ Кошелек подключен:", selectedAccount);

    // После подключения можно инициализировать контракты и показать баланс
    await initContracts();
    await showIbitiBalance(true);
  } catch (err) {
    console.error("❌ Ошибка подключения кошелька:", err);
    // Можно показать alert или справку:
    // alert("Не удалось подключить кошелёк");
  }
}

// ─────────────────────────────────────────────────────────────
// 5) Функция инициализации контрактов (после подключения)
// ─────────────────────────────────────────────────────────────
async function initContracts() {
  if (!signer) return;
  window.ibitiToken   = new ethers.Contract(IBITI_TOKEN_ADDRESS,      ibitiTokenAbi,      signer);
  window.saleManager  = new ethers.Contract(NFTSALEMANAGER_ADDRESS,   nftSaleManagerAbi,  signer);
  window.nftDiscount  = new ethers.Contract(NFT_DISCOUNT_ADDRESS,     nftDiscountAbi,     signer);
  window.phasedSale   = new ethers.Contract(PHASED_TOKENSALE_ADDRESS, PhasedTokenSaleAbi, signer);
  console.log("✅ Контракты инициализированы");
}

// ─────────────────────────────────────────────────────────────
// 6) Показ баланса IBITI (по желанию, если у вас есть элемент с id="ibitiBalance")
// ─────────────────────────────────────────────────────────────
export async function showIbitiBalance(highlight = false) {
  if (!window.ibitiToken || !selectedAccount) return;
  try {
    const balance = await window.ibitiToken.balanceOf(selectedAccount);
    // ethers@6 возвращает BigInt, а formatUnits из пакета ethers.formatUnits
    const formatted = ethers.formatUnits(balance, 8);
    const el = document.getElementById("ibitiBalance");
    if (el) {
      el.innerText = `Ваш баланс IBITI: ${formatted}`;
      if (highlight) {
        el.style.transition = "background 0.3s ease";
        el.style.background = "rgba(255, 215, 0, 0.2)";
        setTimeout(() => (el.style.background = "transparent"), 500);
      }
    }
  } catch (err) {
    console.error("Ошибка при получении баланса:", err);
  }
}

// ─────────────────────────────────────────────────────────────
// 7) Отключение кошелька и удаление кэша
// ─────────────────────────────────────────────────────────────
export async function disconnectWallet() {
  try {
    if (provider?.provider?.disconnect) {
      // Если провайдер поддерживает метод disconnect (например WalletConnect)
      await provider.provider.disconnect();
    }
  } catch (_) { /* игнорируем ошибку */ }

  // Сбрасываем все переменные
  provider = null;
  signer = null;
  selectedAccount = null;

  // Обновляем DOM
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Disconnected";
  const balEl = document.getElementById("ibitiBalance");
  if (balEl) balEl.innerText = "";

  // Очищаем кэш Web3Modal
  await web3Modal.clearCachedProvider();
  console.log("🔌 Кошелек отключен и кэш очищен");
}

// ─────────────────────────────────────────────────────────────
// 8) Привязываем кнопку «Подключить кошелек»
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await connectWallet();
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 9) Автоматическое восстановление соединения (если cacheProvider = true)
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  if (web3Modal.cachedProvider) {
    // Если ранее мы подключались и Web3Modal сохранил провайдер — пробуем сразу восстановиться
    try {
      await connectWallet();
    } catch (e) {
      console.warn("Не удалось автоматически восстановить подключение:", e);
      // Можно очистить кэш, чтобы не пытаться каждый раз
      // await web3Modal.clearCachedProvider();
    }
  }
});

// ─────────────────────────────────────────────────────────────
// 10) Экспортим нужные сущности наружу
// ─────────────────────────────────────────────────────────────
export {
  provider,
  signer,
  selectedAccount
};

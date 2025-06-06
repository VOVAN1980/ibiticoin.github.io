// js/wallet.js
console.log("✅ wallet.js загружен");

// -----------------------------
// 1) Глобальные переменные
// -----------------------------
let provider = null;
let signer = null;
let selectedAccount = null;

// АДРЕСА КОНТРАКТОВ
const IBITI_TOKEN_ADDRESS      = "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196";
const NFTSALEMANAGER_ADDRESS   = "0x5572F3AE84319Fbd6e285a0CB854f92Afd31dd6D";
const NFT_DISCOUNT_ADDRESS     = "0x26C4E3D3E40943D2d569e832A243e329E14ecb02";
const PHASED_TOKENSALE_ADDRESS = "0x3092cFDfF6890F33b3227c3d2740F84772A465c7";

// ABI
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";
import { ethers }             from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";

// -----------------------------
// 2) Подключение через инжект-провайдер (MetaMask/Trust Wallet)
// -----------------------------
async function connectWallet() {
  try {
    // 1) Проверяем, что есть injected-провайдер (MetaMask или Trust Wallet)
    if (!window.ethereum) {
      alert("Injected-провайдер (MetaMask/TrustWallet) не найден. Откройте сайт в MetaMask или в Trust Wallet и попробуйте снова.");
      return;
    }

    // 2) Берём уже подключённые аккаунты
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    let account;
    if (accounts.length === 0) {
      // Если ещё не авторизован — запросим разрешение
      const requested = await window.ethereum.request({ method: "eth_requestAccounts" });
      account = requested[0];
    } else {
      account = accounts[0];
    }
    selectedAccount = account;
    window.selectedAccount = selectedAccount;

    // 3) Выводим адрес в UI
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    // 4) Создаём Ethers.js-провайдер поверх window.ethereum
    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    signer = await web3Provider.getSigner();
    provider = web3Provider;

    // 5) Переключаем сеть на BSC (chainId = 0x38), если нужно
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }] // 0x38 = 56 (BSC)
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        // Если сеть не добавлена — предлагаем добавить
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x38",
              chainName: "Binance Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: ["https://bsc-dataseed.binance.org/"],
              blockExplorerUrls: ["https://bscscan.com"]
            }]
          });
        } catch (addError) {
          console.error("Ошибка при добавлении сети BSC:", addError);
        }
      } else {
        console.error("Не удалось переключить сеть:", switchError);
      }
    }

    console.log("✅ Инжект-провайдер подключён:", selectedAccount);

    // 6) Инициализируем контракты и показываем баланс
    await initContracts();
    await showIbitiBalance(true);

    // 7) Слушаем смену аккаунта
    window.ethereum.on("accountsChanged", async (newAccounts) => {
      if (!newAccounts.length) {
        disconnectWallet();
        return;
      }
      selectedAccount = newAccounts[0];
      window.selectedAccount = selectedAccount;
      const wEl = document.getElementById("walletAddress");
      if (wEl) wEl.innerText = selectedAccount;
      await showIbitiBalance(true);
    });

    // 8) Слушаем отключение
    window.ethereum.on("disconnect", () => {
      disconnectWallet();
    });

  } catch (err) {
    console.error("❌ Ошибка подключения через injected-провайдер:", err);
    alert("Не удалось подключиться к кошельку.");
  }
}

// -----------------------------
// 3) Инициализация контрактов
// -----------------------------
async function initContracts() {
  window.ibitiToken  = new ethers.Contract(IBITI_TOKEN_ADDRESS,      ibitiTokenAbi,      signer);
  window.saleManager = new ethers.Contract(NFTSALEMANAGER_ADDRESS,   nftSaleManagerAbi,  signer);
  window.nftDiscount = new ethers.Contract(NFT_DISCOUNT_ADDRESS,     nftDiscountAbi,     signer);
  window.phasedSale  = new ethers.Contract(PHASED_TOKENSALE_ADDRESS, PhasedTokenSaleAbi, signer);

  console.log("✅ Контракты инициализированы");
}

// -----------------------------
// 4) Показ баланса
// -----------------------------
async function showIbitiBalance(highlight = false) {
  if (!window.ibitiToken || !selectedAccount) return;
  try {
    const balance = await window.ibitiToken.balanceOf(selectedAccount);
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

// -----------------------------
// 5) Отключение
// -----------------------------
async function disconnectWallet() {
  // У MetaMask/Trust Wallet обычно нет явного метода disconnect(),
  // но добавляем на всякий случай, если провайдер поддерживает:
  if (provider?.provider?.disconnect) {
    await provider.provider.disconnect();
  }
  provider = null;
  signer = null;
  selectedAccount = null;

  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Disconnected";

  const el = document.getElementById("ibitiBalance");
  if (el) el.innerText = "";

  console.log("🔌 Кошелек отключен");
}

// -----------------------------
// 6) Вешаем на кнопку connectWalletBtn
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", (e) => {
      e.preventDefault();
      connectWallet();
    });
  } else {
    console.warn("Кнопка с id='connectWalletBtn' не найдена в DOM.");
  }
});

// -----------------------------
// 7) Экспорт
// -----------------------------
export {
  connectWallet,
  disconnectWallet,
  provider,
  signer,
  showIbitiBalance,
  selectedAccount
};

// Глобальный экспорт для доступа из других скриптов
window.connectWallet     = connectWallet;
window.disconnectWallet  = disconnectWallet;
window.showIbitiBalance  = showIbitiBalance;
window.selectedAccount   = selectedAccount;

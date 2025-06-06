// js/wallet.js
console.log("✅ wallet.js загружен");

// -----------------------------
// 1) Глобальные переменные
// -----------------------------
let provider = null;
let signer = null;
let selectedAccount = null;

// Адреса ваших контрактов
const IBITI_TOKEN_ADDRESS      = "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196";
const NFTSALEMANAGER_ADDRESS   = "0x5572F3AE84319Fbd6e285a0CB854f92Afd31dd6D";
const NFT_DISCOUNT_ADDRESS     = "0x26C4E3D3E40943D2d569e832A243e329E14ecb02";
const PHASED_TOKENSALE_ADDRESS = "0x3092cFDfF6890F33b3227c3d2740F84772A465c7";

// ABI
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";
import { ethers }             from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";

// -----------------------------
// 2) Чистый WalletConnectProvider V1
// -----------------------------
// В HTML должен быть:
// <script src="https://unpkg.com/@walletconnect/web3-provider@1.6.6/dist/umd/index.min.js"></script>
const WalletConnectProviderConstructor =
  window.WalletConnectProvider?.default || window.WalletConnectProvider;

// -----------------------------
// 3) Функция подключения кошелька
// -----------------------------
async function connectWallet() {
  try {
    // ИЗМЕНЕНИЕ: явно указываем HTTP-бридж, чтобы НЕ было попыток wss://*.bridge.walletconnect.org
    const wcProvider = new WalletConnectProviderConstructor({
      rpc: {
        56: "https://bsc-dataseed.binance.org/"
      },
      chainId: 56,
      bridge: "https://bridge.walletconnect.org",  // <— обязательно HTTPS, а не WSS
      qrcode: true
    });

    console.log("🔌 Открываем WalletConnectProvider напрямую...");
    await wcProvider.enable();

    // Превращаем его в ethers-провайдер
    const web3Provider = new ethers.BrowserProvider(wcProvider);
    signer = await web3Provider.getSigner();
    provider = web3Provider;

    selectedAccount = await signer.getAddress();
    window.selectedAccount = selectedAccount;

    // Отображаем адрес
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    // Слушаем смену аккаунта
    wcProvider.on("accountsChanged", async (accs) => {
      if (accs.length === 0) {
        disconnectWallet();
        return;
      }
      selectedAccount = accs[0];
      if (walletDisplay) walletDisplay.innerText = selectedAccount;
      await showIbitiBalance(true);
    });

    // Слушаем отключение
    wcProvider.on("disconnect", () => {
      disconnectWallet();
    });

    console.log("✅ Кошелек подключен:", selectedAccount);

    await initContracts();
    await showIbitiBalance(true);
  } catch (err) {
    console.error("❌ Ошибка подключения:", err);
    alert("Ошибка подключения кошелька");
  }
}

// -----------------------------
// 4) Инициализация контрактов
// -----------------------------
async function initContracts() {
  window.ibitiToken  = new ethers.Contract(IBITI_TOKEN_ADDRESS,      ibitiTokenAbi,      signer);
  window.saleManager = new ethers.Contract(NFTSALEMANAGER_ADDRESS,   nftSaleManagerAbi,  signer);
  window.nftDiscount = new ethers.Contract(NFT_DISCOUNT_ADDRESS,     nftDiscountAbi,     signer);
  window.phasedSale  = new ethers.Contract(PHASED_TOKENSALE_ADDRESS, PhasedTokenSaleAbi, signer);

  console.log("✅ Контракты инициализированы");
}

// -----------------------------
// 5) Показ баланса IBITI
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
// 6) Отключение кошелька
// -----------------------------
async function disconnectWallet() {
  try {
    provider?.provider?.disconnect();
  } catch {
    // Игнорируем ошибки
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
// 7) Вешаем обработчик на кнопку
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", (e) => {
      e.preventDefault();
      connectWallet();
    });
  } else {
    console.warn("Кнопка с id='connectWalletBtn' не найдена.");
  }
});

// -----------------------------
// 8) Экспорт
// -----------------------------
export {
  connectWallet,
  disconnectWallet,
  provider,
  signer,
  showIbitiBalance,
  selectedAccount
};

window.connectWallet    = connectWallet;
window.disconnectWallet = disconnectWallet;
window.showIbitiBalance = showIbitiBalance;
window.selectedAccount  = selectedAccount;

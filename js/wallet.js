// js/wallet.js
console.log("wallet.js загружен");

let provider = null;
let signer = null;
let selectedAccount = null;

// Параметры для WalletConnect v2
const PROJECT_ID = "your_verified_project_id"; // Ваш projectId
const RELAY_URL = "wss://relay.walletconnect.com";

// -----------------------------
// 1) Настройка провайдеров Web3Modal
// -----------------------------
const WalletConnectProviderConstructor =
  window.WalletConnectProvider?.default || window.WalletConnectProvider;

const providerOptions = {
  injected: {
    display: {
      name: "MetaMask",
      description: "Connect with the provider in your Browser"
    },
    package: null
  },
  walletconnect: {
    package: WalletConnectProviderConstructor,
    options: {
      projectId: PROJECT_ID,
      relayUrl: RELAY_URL,
      metadata: {
        name: "IBITIcoin Dapp",
        description: "Оригинальное окно Web3Modal",
        url: "https://ibiticoin.com",
        icons: ["https://ibiticoin.com/img/logo.png"]
      }
    }
  }
};

// Создаем экземпляр Web3Modal v2
const web3Modal = new window.Web3Modal.default({
  cacheProvider: false,
  disableInjectedProvider: false, // чтобы MetaMask был виден
  providerOptions
});

// -----------------------------
// 2) Функция подключения
// -----------------------------
async function connectWallet() {
  try {
    console.log("Подключение кошелька...");
    // Очистка кэша (на всякий случай)
    web3Modal.clearCachedProvider();
    
    provider = await web3Modal.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);
    signer = web3Provider.getSigner();
    
    const accounts = await web3Provider.listAccounts();
    if (!accounts.length) {
      console.warn("Нет аккаунтов");
      return;
    }
    selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;
    
    // События
    provider.on("accountsChanged", (accs) => {
      if (!accs.length) return disconnectWallet();
      selectedAccount = accs[0];
      if (walletDisplay) walletDisplay.innerText = selectedAccount;
    });
    
    provider.on("disconnect", () => disconnectWallet());
    
    console.log("Кошелек подключен:", selectedAccount);
    await initContracts(web3Provider);
  } catch (err) {
    console.error("Ошибка подключения:", err);
    alert("Ошибка подключения кошелька");
  }
}

// -----------------------------
// 3) Инициализация контрактов
// -----------------------------
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi } from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi } from "./abis/nftDiscountAbi.js";

const IBITI_TOKEN_ADDRESS    = "0xBCbB45CE07e6026Ed6A4911b2DCabd0544615fBe";
const NFTSALEMANAGER_ADDRESS = "0xdBae91e49da7096f451C8D3db67E274EB5919e48";
const NFT_DISCOUNT_ADDRESS   = "0x680C093B347C7d6C2DAd24D4796e67eF9694096C";

async function initContracts(web3Provider) {
  const signerLocal = web3Provider.getSigner();
  window.ibitiToken = new ethers.Contract(
    IBITI_TOKEN_ADDRESS,
    ibitiTokenAbi,
    signerLocal
  );
  window.saleManager = new ethers.Contract(
    NFTSALEMANAGER_ADDRESS,
    nftSaleManagerAbi,
    signerLocal
  );
  window.nftDiscount = new ethers.Contract(
    NFT_DISCOUNT_ADDRESS,
    nftDiscountAbi,
    signerLocal
  );
  console.log("Контракты инициализированы");
}

// -----------------------------
// 4) Отключение
// -----------------------------
async function disconnectWallet() {
  if (provider && provider.close) {
    await provider.close();
  }
  provider = null;
  signer = null;
  selectedAccount = null;
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";
  console.log("Кошелек отключен");
}

// -----------------------------
// 5) Привязка к кнопке
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", (e) => {
      e.preventDefault();
      connectWallet();
    });
  }
});

// -----------------------------
// 6) Экспорт
// -----------------------------
export {
  connectWallet,
  disconnectWallet,
  provider,
  signer,
  selectedAccount
};

console.log("wallet.js загружен");

// -----------------------------
// 1) Глобальные переменные
// -----------------------------
let provider = null;
let signer = null;
let selectedAccount = null;

const INFURA_ID = "1faccf0f1fdc4532ad7a1a38a67ee906";
const WALLETCONNECT_PROJECT_ID = "95f126f3a088cebcf781d2a1c10711fc";

// Адреса контрактов
const IBITI_TOKEN_ADDRESS      = "0x5fab4e25c0E75aB4a50Cac19Bf62f58dB8E597c6";
const NFTSALEMANAGER_ADDRESS   = "0xf2A9cB2F09C1f1A8103441D13a78330B028a41DA";
const NFT_DISCOUNT_ADDRESS     = "0x776D125B0abf3a6B10d446e9F8c0a96bBDcbC511";

// Импорт ABI для контрактов
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";

// -----------------------------
// 2) Настройка Web3Modal и WalletConnect v2
// -----------------------------
// Получаем конструктор WalletConnectProvider
const WalletConnectProviderConstructor = window.WalletConnectProvider?.default || window.WalletConnectProvider;

// Параметры подключения для провайдеров
const providerOptions = {
  injected: {
    display: {
      name: "MetaMask",
      description: "Подключитесь через MetaMask"
    },
    package: null
  },
  walletconnect: {
    package: WalletConnectProviderConstructor,
    options: {
      projectId: WALLETCONNECT_PROJECT_ID,
      rpcMap: {
        1: `https://mainnet.infura.io/v3/${INFURA_ID}`,
        56: "https://bsc-dataseed.binance.org/"
      },
      metadata: {
        name: "IBITIcoin",
        description: "Подключение к IBITIcoin DApp",
        url: "https://ibiticoin.com",
        icons: ["https://ibiticoin.com/logo.png"]
      },
      mobileLinks: ["trust", "metamask"]
    }
  }
};

// Всегда разрешаем встроенные провайдеры (для всех устройств)
const web3Modal = new (window.Web3Modal?.default || window.Web3Modal)({
  cacheProvider: false,
  disableInjectedProvider: false,
  providerOptions
});

// Очистка кэша провайдера
web3Modal.clearCachedProvider();

// -----------------------------
// 3) Функция подключения кошелька
// -----------------------------
async function connectWallet() {
  try {
    console.log("Подключение кошелька...");
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
    if (walletDisplay) {
      walletDisplay.innerText = selectedAccount;
    }
    // Логирование для отладки смены аккаунтов
    provider.on("accountsChanged", (accs) => {
      console.log("accountsChanged:", accs);
      if (!accs.length) return disconnectWallet();
      selectedAccount = accs[0];
      if (walletDisplay) walletDisplay.innerText = selectedAccount;
    });
    provider.on("disconnect", () => {
      console.log("provider disconnect event");
      disconnectWallet();
    });
    console.log("Кошелек подключен:", selectedAccount);
    await initContracts(web3Provider);
  } catch (err) {
    console.error("Ошибка подключения:", err);
    alert("Ошибка подключения кошелька");
  }
}

// -----------------------------
// 4) Инициализация контрактов
// -----------------------------
async function initContracts(web3Provider) {
  const signer = web3Provider.getSigner();
  window.ibitiToken = new ethers.Contract(
    IBITI_TOKEN_ADDRESS,
    ibitiTokenAbi,
    signer
  );
  window.saleManager = new ethers.Contract(
    NFTSALEMANAGER_ADDRESS,
    nftSaleManagerAbi,
    signer
  );
  window.nftDiscount = new ethers.Contract(
    NFT_DISCOUNT_ADDRESS,
    nftDiscountAbi,
    signer
  );
  console.log("Контракты инициализированы");
}

// -----------------------------
// 5) Функция отключения кошелька
// -----------------------------
async function disconnectWallet() {
  if (provider?.close) await provider.close();
  provider = null;
  signer = null;
  selectedAccount = null;
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";
  console.log("Кошелек отключен");
}

// -----------------------------
// 6) Привязка обработчика к кнопке подключения
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (!connectBtn) {
    console.error("Элемент с id 'connectWalletBtn' не найден");
    return;
  }
  console.log("Элемент connectWalletBtn найден:", connectBtn);
  connectBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Кнопка подключения нажата");
    connectWallet();
  });
});

// -----------------------------
// 7) Экспорт функций для подключения и отключения
// -----------------------------
export { connectWallet, disconnectWallet };

// js/wallet.js
console.log("wallet.js загружен");

// -----------------------------
// 1) Глобальные переменные
// -----------------------------
let provider = null;
let signer = null;
let selectedAccount = null;

const PROJECT_ID = "your_verified_project_id"; // Ваш верифицированный ключ для WalletConnect v2
const INFURA_ID = "1faccf0f1fdc4532ad7a1a38a67ee906"; // Ваш Infura ключ

// Адреса контрактов
const IBITI_TOKEN_ADDRESS      = "0xBCbB45CE07e6026Ed6A4911b2DCabd0544615fBe";
const NFTSALEMANAGER_ADDRESS   = "0xdBae91e49da7096f451C8D3db67E274EB5919e48";
const NFT_DISCOUNT_ADDRESS     = "0x680C093B347C7d6C2DAd24D4796e67eF9694096C";

// ABI
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";

// -----------------------------
// 2) Web3Modal настройка с двумя провайдерами
// -----------------------------
const WalletConnectProviderConstructor = window.WalletConnectProvider?.default || window.WalletConnectProvider;

const providerOptions = {
  injected: {
    display: {
      name: "MetaMask",
      description: "Используйте встроенный кошелек (например, MetaMask)"
    },
    package: null
  },
  walletconnect: {
    package: WalletConnectProviderConstructor,
    options: {
      projectId: PROJECT_ID,
      relayUrl: "wss://relay.walletconnect.com", // Актуальный relay-сервер для v2
      metadata: {
        name: "My Dapp",
        description: "Описание моего Dapp",
        url: "https://your-dapp-url.com",
        icons: ["https://your-dapp-url.com/icon.png"]
      }
    }
  }
};

const web3Modal = new (window.Web3Modal?.default || window.Web3Modal)({
  cacheProvider: false,           // не сохраняем выбор провайдера
  disableInjectedProvider: false,  // разрешаем наличие Injected-провайдера в списке
  providerOptions
});

// -----------------------------
// 3) Подключение кошелька с принудительным открытием модального окна
// -----------------------------
async function connectWallet() {
  try {
    console.log("Подключение кошелька...");
    // Очистка кэша провайдера
    web3Modal.clearCachedProvider();

    // Если метод openModal доступен, вызываем его для принудительного показа окна выбора
    if (typeof web3Modal.openModal === "function") {
      web3Modal.openModal();
    }
    
    // Дожидаемся выбора пользователя (модальное окно должно появиться)
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

    // Обработка изменения аккаунтов
    provider.on("accountsChanged", (accs) => {
      if (!accs.length) return disconnectWallet();
      selectedAccount = accs[0];
      if (walletDisplay) walletDisplay.innerText = selectedAccount;
    });

    // Обработка отключения
    provider.on("disconnect", () => disconnectWallet());

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
// 5) Отключение кошелька
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
// 6) Обработчик кнопки подключения
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
// 7) Экспорт
// -----------------------------
export { connectWallet, disconnectWallet, provider, signer, selectedAccount };


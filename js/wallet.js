console.log("wallet.js загружен");

// -----------------------------
// 1) Глобальные переменные
// -----------------------------
let provider = null;
let signer = null;
let selectedAccount = null;

const INFURA_ID = "1faccf0f1fdc4532ad7a1a38a67ee906";

// Адреса контрактов
const IBITI_TOKEN_ADDRESS      = "0x5fab4e25c0E75aB4a50Cac19Bf62f58dB8E597c6";
const NFTSALEMANAGER_ADDRESS   = "0xf2A9cB2F09C1f1A8103441D13a78330B028a41DA";
const NFT_DISCOUNT_ADDRESS     = "0x776D125B0abf3a6B10d446e9F8c0a96bBDcbC511";

// Импорт ABI для контрактов
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";

// -----------------------------
// 2) Функция для определения мобильного устройства (на будущее, если потребуется)
// -----------------------------
function isMobileDevice() {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

// -----------------------------
// 3) Настройка Web3Modal и WalletConnect v2
// -----------------------------
// Получаем конструктор WalletConnectProvider (поддерживает разные варианты подключения)
const WalletConnectProviderConstructor = window.WalletConnectProvider?.default || window.WalletConnectProvider;

// Параметры подключения для провайдеров
const providerOptions = {
  // Встроенный провайдер (например, MetaMask)
  injected: {
    display: {
      name: "MetaMask",
      description: "Подключитесь через MetaMask"
    },
    package: null
  },
  // Провайдер WalletConnect
  walletconnect: {
    package: WalletConnectProviderConstructor,
    options: {
      projectId: WALLETCONNECT_PROJECT_ID, // Ваш projectId для WalletConnect Cloud
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
      // Явно указываем мобильные кошельки для deep linking
      mobileLinks: ["trust", "metamask"]
    }
  }
};

// Создание экземпляра Web3Modal.
// Здесь мы всегда разрешаем встроенные провайдеры, независимо от устройства.
const web3Modal = new (window.Web3Modal?.default || window.Web3Modal)({
  cacheProvider: false,
  disableInjectedProvider: false, // всегда разрешаем выбор кошельков
  providerOptions
});

// Очистка кэша провайдера на всякий случай
web3Modal.clearCachedProvider();

// -----------------------------
// 4) Функция подключения кошелька
// -----------------------------
async function connectWallet() {
  try {
    console.log("Подключение кошелька...");
    // Открываем окно выбора провайдера
    provider = await web3Modal.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);
    signer = web3Provider.getSigner();
    const accounts = await web3Provider.listAccounts();
    if (!accounts.length) return console.warn("Нет аккаунтов");

    selectedAccount = accounts[0];
    // Отображаем адрес подключенного кошелька на странице
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    // Обработчик смены аккаунтов
    provider.on("accountsChanged", (accs) => {
      if (!accs.length) return disconnectWallet();
      selectedAccount = accs[0];
      if (walletDisplay) walletDisplay.innerText = selectedAccount;
    });

    // Обработчик отключения кошелька
    provider.on("disconnect", () => disconnectWallet());

    console.log("Кошелек подключен:", selectedAccount);
    await initContracts(web3Provider);
  } catch (err) {
    console.error("Ошибка подключения:", err);
    alert("Ошибка подключения кошелька");
  }
}

// -----------------------------
// 5) Инициализация контрактов
// -----------------------------
async function initContracts(web3Provider) {
  const signer = web3Provider.getSigner();

  // Создаем экземпляры контрактов для дальнейшего взаимодействия
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
// 6) Функция отключения кошелька
// -----------------------------
async function disconnectWallet() {
  // Если провайдер поддерживает метод close, вызываем его
  if (provider?.close) await provider.close();
  provider = null;
  signer = null;
  selectedAccount = null;
  // Обновляем отображение адреса на странице
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";
  console.log("Кошелек отключен");
}

// -----------------------------
// 7) Обработчик клика на кнопку подключения
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
// 8) Экспорт функций для подключения и отключения
// -----------------------------
export { connectWallet, disconnectWallet };

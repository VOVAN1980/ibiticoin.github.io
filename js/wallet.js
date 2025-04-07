// js/wallet.js
console.log("wallet.js загружен");

// -----------------------------
// 1) Глобальные переменные
// -----------------------------
let provider = null;
let signer = null;
let selectedAccount = null;

const PROJECT_ID = "your_verified_project_id"; // Замените на ваш верифицированный ключ для WalletConnect v2

// Адреса контрактов
const IBITI_TOKEN_ADDRESS      = "0xBCbB45CE07e6026Ed6A4911b2DCabd0544615fBe";
const NFTSALEMANAGER_ADDRESS   = "0xdBae91e49da7096f451C8D3db67E274EB5919e48";
const NFT_DISCOUNT_ADDRESS     = "0x680C093B347C7d6C2DAd24D4796e67eF9694096C";

// -----------------------------
// 2) Импорт ABI
// -----------------------------
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";

// -----------------------------
// 3) Настройка Web3Modal для WalletConnect v2
// -----------------------------
// Используем новую версию WalletConnect Provider (v2)
const WalletConnectProviderConstructor = window.WalletConnectProvider?.default || window.WalletConnectProvider;

// Параметры для WalletConnect v2
const walletConnectOptions = {
  package: WalletConnectProviderConstructor,
  options: {
    projectId: PROJECT_ID,
    relayUrl: "wss://relay.walletconnect.com", // Актуальный relay-сервер для v2
    metadata: {
      name: "IBITIcoin Dapp",
      description: "Инновационная криптовалюта и NFT от IBITIcoin",
      url: "https://your-dapp-url.com",
      icons: ["https://your-dapp-url.com/icon.png"]
    }
  }
};

// В данном случае мы используем только один провайдер – WalletConnect – как в оригинале
const providerOptions = {
  walletconnect: walletConnectOptions
};

const web3Modal = new (window.Web3Modal?.default || window.Web3Modal)({
  cacheProvider: false,
  providerOptions
});

// -----------------------------
// 4) Функция подключения кошелька
// -----------------------------
async function connectWallet() {
  try {
    console.log("Подключение кошелька...");
    // Очищаем предыдущий выбор, чтобы всегда показывалось окно
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
// 5) Инициализация контрактов
// -----------------------------
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
// 6) Функция отключения кошелька
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
// 7) Обработчик кнопки подключения
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
// 8) Экспорт функций и переменных
// -----------------------------
export { connectWallet, disconnectWallet, provider, signer, selectedAccount };

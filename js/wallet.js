console.log("wallet.js загружен");

// -----------------------------
// 1) Глобальные переменные
// -----------------------------
let provider = null;
let selectedAccount = null;

const INFURA_ID = "1faccf0f1fdc4532ad7a1a38a67ee906"; // Заглушка, замените на реальный infuraId

// Адреса контрактов (BSC Testnet из .env)
const IBITI_TOKEN_ADDRESS      = "0xd2E16a09cD7B72ba6B74E40B8aA9d7C8A4c04B62";
const NFTSALEMANAGER_ADDRESS   = "0xCE85Ddd14fe96f011779b73BAD7A46E65320c5e4";
const NFT_DISCOUNT_ADDRESS     = "0xaa2D809EBd56Bc91f4EcA369B069e0b97b548990";
// ... при желании добавляй остальные, типа FEE_MANAGER_ADDRESS = "...";

// Импортируем ABI из локальных .js-файлов
// Важно: эти файлы должны быть подключены как ES-модули
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js"; // если нужно

// -----------------------------
// 2) Настраиваем Web3Modal
// -----------------------------
const WalletConnectProviderConstructor = window.WalletConnectProvider?.default || window.WalletConnectProvider;

const providerOptions = {
  walletconnect: {
    package: WalletConnectProviderConstructor,
    options: {
      infuraId: INFURA_ID
    }
  }
};

const web3Modal = new (window.Web3Modal?.default || window.Web3Modal)({
  cacheProvider: false,
  providerOptions
});

// -----------------------------
// 3) Основные функции
// -----------------------------
async function connectWallet() {
  try {
    console.log("Подключение кошелька через Web3Modal...");

    // Показываем окно выбора кошелька (Metamask, WalletConnect и т.п.)
    provider = await web3Modal.connect();

    // ethers.js провайдер
    const web3Provider = new ethers.providers.Web3Provider(provider);
    const accounts = await web3Provider.listAccounts();

    if (!accounts.length) {
      console.warn("Нет аккаунтов");
      return;
    }

    selectedAccount = accounts[0];
    // Показать адрес в элементе #walletAddress (если есть)
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    // События изменения аккаунта и дисконнекта
    provider.on("accountsChanged", (accs) => {
      if (!accs.length) return disconnectWallet();
      selectedAccount = accs[0];
      if (walletDisplay) walletDisplay.innerText = selectedAccount;
    });
    provider.on("disconnect", () => disconnectWallet());

    console.log("Кошелек подключен:", selectedAccount);

    // Теперь создаём объекты контрактов
    await initContracts(web3Provider);

  } catch (err) {
    console.error("Ошибка подключения:", err);
    alert("Не удалось подключить кошелек.");
  }
}

async function initContracts(web3Provider) {
  const signer = web3Provider.getSigner();

  // 1) Контракт токена IBITI
  window.ibitiToken = new ethers.Contract(
    IBITI_TOKEN_ADDRESS,
    ibitiTokenAbi,
    signer
  );
  console.log("ibitiToken инициализирован:", window.ibitiToken);

  // 2) Контракт NFTSaleManager
  window.saleManager = new ethers.Contract(
    NFTSALEMANAGER_ADDRESS,
    nftSaleManagerAbi,
    signer
  );
  console.log("saleManager инициализирован:", window.saleManager);

  // 3) Контракт NFTDiscount (если нужен)
  window.nftDiscount = new ethers.Contract(
    NFT_DISCOUNT_ADDRESS,
    nftDiscountAbi,
    signer
  );
  console.log("nftDiscount инициализирован:", window.nftDiscount);

  // ... При желании инициализируй остальные
}

async function disconnectWallet() {
  if (provider?.close) await provider.close();
  provider = null;
  selectedAccount = null;
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";
  console.log("Кошелек отключен");
}

// -----------------------------
// 4) Обработчик кнопки
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

// Экспортируем при необходимости (если нужно использовать ES-модули где-то ещё)
export { connectWallet, disconnectWallet };

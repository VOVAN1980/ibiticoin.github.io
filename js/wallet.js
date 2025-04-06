// js/wallet.js
console.log("wallet.js загруж");

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

// -----------------------------
// 2) Импорт ABI
// -----------------------------
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";

// -----------------------------
// 3) Конфигурация Web3Modal для WalletConnect
// -----------------------------
const WalletConnectProviderConstructor = window.WalletConnectProvider?.default || window.WalletConnectProvider;

const walletConnectOptions = {
  package: WalletConnectProviderConstructor,
  options: {
    projectId: PROJECT_ID,
    relayUrl: "wss://relay.walletconnect.com",
    metadata: {
      name: "My Dapp",
      description: "Описание моего Dapp",
      url: "https://your-dapp-url.com",
      icons: ["https://your-dapp-url.com/icon.png"]
    }
  }
};

const walletConnectProviderOptions = {
  walletconnect: walletConnectOptions
};

const web3ModalWC = new (window.Web3Modal?.default || window.Web3Modal)({
  cacheProvider: false,
  providerOptions: walletConnectProviderOptions
});

// -----------------------------
// 4) Функции подключения для разных кошельков
// -----------------------------

// Подключение MetaMask
function connectMetaMask() {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask не установлен. Перейдите на https://metamask.io для установки.");
    return Promise.reject("MetaMask not installed");
  }
  return window.ethereum.request({ method: "eth_requestAccounts" })
    .then(() => {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = web3Provider.getSigner();
      return web3Provider.listAccounts().then(accounts => {
        if (!accounts.length) {
          console.warn("Нет аккаунтов");
          return;
        }
        selectedAccount = accounts[0];
        provider = window.ethereum; // для консистентности
        const walletDisplay = document.getElementById("walletAddress");
        if (walletDisplay) walletDisplay.innerText = selectedAccount;
        console.log("MetaMask подключен:", selectedAccount);
        return initContracts(web3Provider);
      });
    })
    .catch(err => {
      console.error("Ошибка подключения MetaMask:", err);
      alert("Ошибка подключения MetaMask");
    });
}

// Подключение через WalletConnect
async function connectWalletConnect() {
  try {
    console.log("Подключение через WalletConnect...");
    web3ModalWC.clearCachedProvider();
    provider = await web3ModalWC.connect();
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
    
    console.log("WalletConnect подключен:", selectedAccount);
    await initContracts(web3Provider);
  } catch (err) {
    console.error("Ошибка подключения WalletConnect:", err);
    alert("Ошибка подключения через WalletConnect");
  }
}

// -----------------------------
// 5) Функция показа модального окна выбора кошелька
// -----------------------------
function showWalletSelectionModal() {
  // Создаем overlay
  const overlay = document.createElement("div");
  overlay.id = "walletSelectionOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.6)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "1000";
  
  // Создаем контейнер модального окна
  const modal = document.createElement("div");
  modal.style.backgroundColor = "#fff";
  modal.style.padding = "20px";
  modal.style.borderRadius = "8px";
  modal.style.textAlign = "center";
  
  // Заголовок
  const title = document.createElement("h2");
  title.innerText = "Выберите кошелек для подключения";
  modal.appendChild(title);
  
  // Кнопка MetaMask
  const btnMetaMask = document.createElement("button");
  btnMetaMask.innerText = "MetaMask";
  btnMetaMask.style.margin = "10px";
  btnMetaMask.onclick = () => {
    document.body.removeChild(overlay);
    connectMetaMask();
  };
  modal.appendChild(btnMetaMask);
  
  // Кнопка WalletConnect
  const btnWalletConnect = document.createElement("button");
  btnWalletConnect.innerText = "WalletConnect";
  btnWalletConnect.style.margin = "10px";
  btnWalletConnect.onclick = () => {
    document.body.removeChild(overlay);
    connectWalletConnect();
  };
  modal.appendChild(btnWalletConnect);
  
  // Добавляем модальное окно на страницу
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// -----------------------------
// 6) Инициализация контрактов
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
// 7) Отключение кошелька
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
// 8) Обработчик кнопки подключения
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showWalletSelectionModal();
    });
  }
});

// -----------------------------
// 9) Экспорт функций
// -----------------------------
export { connectMetaMask, connectWalletConnect, showWalletSelectionModal, disconnectWallet, provider, signer, selectedAccount };

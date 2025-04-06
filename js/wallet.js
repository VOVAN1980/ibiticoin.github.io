// js/wallet.js
console.log("wallet.js загруж");

// -----------------------------
// 1) Глобальные переменные
// -----------------------------
let provider = null;
let signer = null;
let selectedAccount = null;

const PROJECT_ID = "your_verified_project_id"; // Ваш верифицированный ключ для WalletConnect v2
const INFURA_ID = "1faccf0f1fdc4532ad7a1a38a67ee906"; // Если понадобится для других операций

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
// 3) Настройка Web3Modal для WalletConnect (отдельно)
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

const web3ModalWC = new (window.Web3Modal?.default || window.Web3Modal)({
  cacheProvider: false,
  providerOptions: { walletconnect: walletConnectOptions }
});

// -----------------------------
// 4) Функции подключения
// -----------------------------

// Подключение через MetaMask (Injected)
async function connectMetaMask() {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask не установлен. Перейдите на https://metamask.io для установки.");
    window.open("https://metamask.io", "_blank");
    return;
  }
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = web3Provider.getSigner();
    const accounts = await web3Provider.listAccounts();
    if (!accounts.length) {
      alert("Аккаунты не найдены");
      return;
    }
    selectedAccount = accounts[0];
    provider = window.ethereum;
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;
    console.log("MetaMask подключен:", selectedAccount);
    await initContracts(web3Provider);
  } catch (err) {
    console.error("Ошибка подключения MetaMask:", err);
    alert("Ошибка подключения MetaMask");
  }
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
      alert("Аккаунты не найдены (WalletConnect)");
      return;
    }
    selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;
    
    // Обработка событий
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
// 5) Кастомное модальное окно выбора кошелька
// -----------------------------
function showWalletSelectionModal() {
  // Если уже есть, удаляем
  const oldOverlay = document.getElementById("walletSelectionOverlay");
  if (oldOverlay) document.body.removeChild(oldOverlay);
  
  // Overlay с темным фоном и золотой рамкой
  const overlay = document.createElement("div");
  overlay.id = "walletSelectionOverlay";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "1000"
  });
  
  // Модальное окно с золотой рамкой
  const modal = document.createElement("div");
  Object.assign(modal.style, {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
    width: "320px",
    border: "3px solid gold",
    boxShadow: "0 2px 10px rgba(0,0,0,0.5)"
  });
  
  // Заголовок
  const title = document.createElement("h2");
  title.innerText = "Выберите кошелек";
  title.style.marginBottom = "20px";
  modal.appendChild(title);
  
  // Контейнер кнопок
  const buttonsContainer = document.createElement("div");
  buttonsContainer.style.display = "flex";
  buttonsContainer.style.flexDirection = "column";
  buttonsContainer.style.gap = "15px";
  
  // Кнопка MetaMask с логотипом
  const btnMetaMask = document.createElement("button");
  btnMetaMask.innerHTML = `
    <img src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" style="width:30px; margin-right:10px; vertical-align:middle;" />
    MetaMask
  `;
  Object.assign(btnMetaMask.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    fontSize: "16px",
    cursor: "pointer",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#f0f0f0"
  });
  btnMetaMask.onclick = () => {
    document.body.removeChild(overlay);
    connectMetaMask();
  };
  buttonsContainer.appendChild(btnMetaMask);
  
  // Кнопка WalletConnect с логотипом
  const btnWalletConnect = document.createElement("button");
  btnWalletConnect.innerHTML = `
    <img src="https://avatars.githubusercontent.com/u/37784886?s=200&v=4" style="width:30px; margin-right:10px; vertical-align:middle;" />
    WalletConnect
  `;
  Object.assign(btnWalletConnect.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    fontSize: "16px",
    cursor: "pointer",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#f0f0f0"
  });
  btnWalletConnect.onclick = () => {
    document.body.removeChild(overlay);
    connectWalletConnect();
  };
  buttonsContainer.appendChild(btnWalletConnect);
  
  modal.appendChild(buttonsContainer);
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
// 8) Обработчик кнопки "Подключить кошелек"
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
// Экспорт функций
// -----------------------------
export {
  connectMetaMask,
  connectWalletConnect,
  showWalletSelectionModal,
  disconnectWallet,
  provider,
  signer,
  selectedAccount
};

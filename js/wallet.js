// js/wallet.js
console.log("wallet.js загружен");

// -----------------------------
// Глобальные переменные
// -----------------------------
let provider = null;
let signer = null;
let selectedAccount = null;

const PROJECT_ID = "your_verified_project_id"; // Ваш верифицированный ключ для WalletConnect v2
// Если Infura нужен - можете использовать его отдельно, здесь пока не критично.

const IBITI_TOKEN_ADDRESS      = "0xBCbB45CE07e6026Ed6A4911b2DCabd0544615fBe";
const NFTSALEMANAGER_ADDRESS   = "0xdBae91e49da7096f451C8D3db67E274EB5919e48";
const NFT_DISCOUNT_ADDRESS     = "0x680C093B347C7d6C2DAd24D4796e67eF9694096C";

// -----------------------------
// Импорт ABI
// -----------------------------
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";

// -----------------------------
// Настройка Web3Modal (только для WalletConnect)
// -----------------------------
const WalletConnectProviderConstructor =
  window.WalletConnectProvider?.default || window.WalletConnectProvider;

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
  providerOptions: {
    walletconnect: walletConnectOptions
  }
});

// -----------------------------
// Функция подключения MetaMask
// -----------------------------
async function connectMetaMask() {
  // Проверяем, установлен ли MetaMask
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask не установлен. Перейдите на https://metamask.io для установки.");
    return;
  }
  try {
    // Запрашиваем доступ к аккаунтам
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = web3Provider.getSigner();
    const accounts = await web3Provider.listAccounts();
    if (!accounts.length) {
      console.warn("Нет аккаунтов в MetaMask");
      return;
    }
    selectedAccount = accounts[0];
    provider = window.ethereum; // Для согласованности
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;
    console.log("MetaMask подключен:", selectedAccount);
    await initContracts(web3Provider);
  } catch (err) {
    console.error("Ошибка подключения MetaMask:", err);
    alert("Ошибка подключения MetaMask");
  }
}

// -----------------------------
// Функция подключения WalletConnect
// -----------------------------
async function connectWalletConnect() {
  try {
    console.log("Подключение через WalletConnect...");
    web3ModalWC.clearCachedProvider(); // Сбрасываем кэш, чтобы всегда спрашивало QR
    provider = await web3ModalWC.connect(); // Покажет QR-код
    const web3Provider = new ethers.providers.Web3Provider(provider);
    signer = web3Provider.getSigner();
    const accounts = await web3Provider.listAccounts();
    if (!accounts.length) {
      console.warn("Нет аккаунтов (WalletConnect)");
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
// Кастомное окно выбора
// -----------------------------
function showWalletSelectionModal() {
  // Удаляем, если уже есть
  const oldOverlay = document.getElementById("walletSelectionOverlay");
  if (oldOverlay) {
    document.body.removeChild(oldOverlay);
  }

  const overlay = document.createElement("div");
  overlay.id = "walletSelectionOverlay";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "1000"
  });

  const modal = document.createElement("div");
  Object.assign(modal.style, {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
    width: "300px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
  });

  const title = document.createElement("h2");
  title.innerText = "Выберите кошелек";
  Object.assign(title.style, {
    marginBottom: "20px"
  });
  modal.appendChild(title);

  // Блок для кнопок
  const buttonsContainer = document.createElement("div");
  Object.assign(buttonsContainer.style, {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  });

  // Кнопка MetaMask
  const btnMetaMask = document.createElement("button");
  btnMetaMask.innerHTML = `
    <img src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg"
         style="width:24px; margin-right:8px; vertical-align:middle;" />
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
    backgroundColor: "#fff"
  });
  btnMetaMask.onclick = () => {
    document.body.removeChild(overlay);
    connectMetaMask();
  };
  buttonsContainer.appendChild(btnMetaMask);

  // Кнопка WalletConnect
  const btnWalletConnect = document.createElement("button");
  btnWalletConnect.innerHTML = `
    <img src="https://avatars.githubusercontent.com/u/37784886"
         style="width:24px; margin-right:8px; vertical-align:middle;" />
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
    backgroundColor: "#fff"
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
// Инициализация контрактов
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
// Отключение кошелька
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
// Привязка к кнопке "Подключить кошелек"
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
// Экспорт
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

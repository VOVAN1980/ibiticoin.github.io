console.log("wallet.js загружен");

// -----------------------------
// 1. Глобальные переменные
// -----------------------------
let provider = null;
let signer = null;
let selectedAccount = null;

const INFURA_ID = "1faccf0f1fdc4532ad7a1a38a67ee906";

const IBITI_TOKEN_ADDRESS      = "0xBCbB45CE07e6026Ed6A4911b2DCabd0544615fBe";
const NFTSALEMANAGER_ADDRESS   = "0xdBae91e49da7096f451C8D3db67E274EB5919e48";
const NFT_DISCOUNT_ADDRESS     = "0x680C093B347C7d6C2DAd24D4796e67eF9694096C";

import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi } from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi } from "./abis/nftDiscountAbi.js";

// -----------------------------
// 2. Provider Options
// -----------------------------
const WalletConnectProviderConstructor = window.WalletConnectProvider?.default || window.WalletConnectProvider;

const providerOptions = {
  metamask: {
    id: "injected",
    name: "MetaMask",
    package: null
  },
  walletconnect: {
    package: WalletConnectProviderConstructor,
    options: {
      infuraId: INFURA_ID,
      rpc: {
        1: "https://mainnet.infura.io/v3/" + INFURA_ID,
        56: "https://bsc-dataseed.binance.org/"
      },
      qrcodeModalOptions: {
        mobileLinks: ["metamask", "trust"]
      }
    }
  }
};

const web3Modal = new (window.Web3Modal?.default || window.Web3Modal)({
  cacheProvider: false, // важно: отключает автопривязку
  providerOptions,
  disableInjectedProvider: false
});

// -----------------------------
// 3. Подключение
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
    console.log("Кошелёк подключён:", selectedAccount);
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    provider.on("accountsChanged", (accs) => {
      if (!accs.length) return disconnectWallet();
      selectedAccount = accs[0];
      if (walletDisplay) walletDisplay.innerText = selectedAccount;
    });

    provider.on("disconnect", () => disconnectWallet());

    await initContracts(web3Provider);
  } catch (err) {
    console.error("Ошибка подключения:", err);
    alert("Ошибка подключения кошелька");
  }
}

// -----------------------------
// 4. Инициализация контрактов
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
// 5. Отключение (по кнопке или при дисконнекте)
// -----------------------------
async function disconnectWallet() {
  try {
    if (provider?.close) await provider.close();
  } catch (e) {
    console.warn("Ошибка при отключении:", e);
  }

  provider = null;
  signer = null;
  selectedAccount = null;

  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";

  console.log("Кошелек отключен");
}

// -----------------------------
// 6. Только по кнопке
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", (e) => {
      e.preventDefault();
      connectWallet();
    });
  }

  const disconnectBtn = document.getElementById("disconnectWalletBtn");
  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", (e) => {
      e.preventDefault();
      disconnectWallet();
    });
  }
});

// -----------------------------
// 7. Экспорт
// -----------------------------
export { connectWallet, disconnectWallet, provider, signer, selectedAccount };

// js/wallet.js
console.log("wallet.js загружен");

let provider = null;
let signer = null;
let selectedAccount = null;

const PROJECT_ID = "your_verified_project_id";
const INFURA_ID = "1faccf0f1fdc4532ad7a1a38a67ee906";

import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi } from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi } from "./abis/nftDiscountAbi.js";

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
      relayUrl: "wss://relay.walletconnect.com",
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
  cacheProvider: false,
  disableInjectedProvider: false,
  providerOptions
});

async function connectWallet() {
  try {
    // Принудительно очищаем кэш перед подключением
    web3Modal.clearCachedProvider();

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

async function initContracts(web3Provider) {
  const signer = web3Provider.getSigner();

  window.ibitiToken = new ethers.Contract(
    "0xBCbB45CE07e6026Ed6A4911b2DCabd0544615fBe",
    ibitiTokenAbi,
    signer
  );
  window.saleManager = new ethers.Contract(
    "0xdBae91e49da7096f451C8D3db67E274EB5919e48",
    nftSaleManagerAbi,
    signer
  );
  window.nftDiscount = new ethers.Contract(
    "0x680C093B347C7d6C2DAd24D4796e67eF9694096C",
    nftDiscountAbi,
    signer
  );

  console.log("Контракты инициализированы");
}

async function disconnectWallet() {
  if (provider?.close) await provider.close();
  provider = null;
  signer = null;
  selectedAccount = null;
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";
  console.log("Кошелек отключен");
}

document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", (e) => {
      e.preventDefault();
      connectWallet();
    });
  }
});

export { connectWallet, disconnectWallet, provider, signer, selectedAccount };

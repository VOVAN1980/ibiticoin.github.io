// wallet.js (обновленная версия для Web3Modal v2 / WalletConnect v2)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import Web3Modal from "https://unpkg.com/web3modal@2.0.8/dist/index.js";
import WalletConnectProvider from "https://cdn.skypack.dev/@walletconnect/ethereum-provider";

// Обновленные настройки для WalletConnect v2
const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      // Используйте ваш Project ID от WalletConnect Cloud
      projectId: "95f126f3a088cebcf781d2a1c10711fc",
      chainId: 97, // Например, BSC Testnet
      // RPC URL для выбранной сети (BSC Testnet)
      rpc: { 97: "https://data-seed-prebsc-1-s1.binance.org:8545/" }
    }
  }
};

const web3Modal = new Web3Modal({
  cacheProvider: false,
  providerOptions,
});

async function connectWallet() {
  try {
    console.log("Подключение кошелька...");
    const provider = await web3Modal.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);
    const signer = web3Provider.getSigner();
    const accounts = await web3Provider.listAccounts();
    if (!accounts.length) return console.warn("Нет аккаунтов");
    const selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    // Обработка изменения аккаунтов и отключения
    provider.on("accountsChanged", (accs) => {
      if (!accs.length) return disconnectWallet();
      if (walletDisplay) walletDisplay.innerText = accs[0];
    });

    provider.on("disconnect", () => disconnectWallet());
    console.log("Кошелек подключен:", selectedAccount);

    // Инициализация ваших контрактов или другой логики
  } catch (err) {
    console.error("Ошибка подключения:", err);
    alert("Ошибка подключения кошелька");
  }
}

async function disconnectWallet() {
  if (window.ethereum?.close) await window.ethereum.close();
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

export { connectWallet, disconnectWallet };

// wallet.js (обновлённая версия для Web3Modal v2 / WalletConnect v2)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
// Импортируем Web3Modal через CDN с использованием Skypack
import Web3Modal from "https://cdn.skypack.dev/@web3modal/standalone";
// Импортируем WalletConnectProvider через CDN
import WalletConnectProvider from "https://cdn.skypack.dev/@walletconnect/ethereum-provider";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      projectId: "95f126f3a088cebcf781d2a1c10711fc", // ваш Project ID
      chainId: 97, // BSC Testnet, при необходимости поменяйте на нужный chainId
      rpc: { 97: "https://data-seed-prebsc-1-s1.binance.org:8545/" } // RPC URL для выбранной сети
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
    const instance = await web3Modal.connect();
    const web3Provider = new ethers.providers.Web3Provider(instance);
    const signer = web3Provider.getSigner();
    const accounts = await web3Provider.listAccounts();
    if (!accounts.length) return console.warn("Нет аккаунтов");
    const selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    instance.on("accountsChanged", (accs) => {
      if (!accs.length) disconnectWallet();
      if (walletDisplay) walletDisplay.innerText = accs[0];
    });
    instance.on("disconnect", () => disconnectWallet());
    console.log("Кошелек подключен:", selectedAccount);
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

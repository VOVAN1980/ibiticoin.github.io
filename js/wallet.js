// wallet.js (обновленная версия для Web3Modal v2 / WalletConnect v2 без сборщиков)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import Web3Modal from "https://cdn.skypack.dev/@web3modal/standalone";
import WalletConnectProvider from "https://cdn.skypack.dev/@walletconnect/ethereum-provider";

// Настройки для WalletConnect v2 с вашим Project ID
const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      projectId: "95f126f3a088cebcf781d2a1c10711fc", // Ваш Project ID
      chainId: 97, // Для BSC Testnet (при необходимости измените)
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
    if (!accounts.length) {
      console.warn("Нет аккаунтов");
      return;
    }
    const selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    // Обработка изменения аккаунтов и отключения
    instance.on("accountsChanged", (accs) => {
      if (!accs.length) {
        disconnectWallet();
      } else if (walletDisplay) {
        walletDisplay.innerText = accs[0];
      }
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

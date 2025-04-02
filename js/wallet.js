import WalletConnectProvider from '@walletconnect/web3-provider';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';

console.log("wallet.js загружен");

let provider;
let selectedAccount;

const INFURA_KEY = "1faccf0f1fdc4532ad7a1a38a67ee906";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: INFURA_KEY
    }
  }
};

const web3Modal = new Web3Modal({
  cacheProvider: false,
  providerOptions
});

async function connectWallet() {
  console.log("connectWallet() вызывается");
  try {
    // Проверяем наличие инжектированного кошелька (MetaMask)
    if (window.ethereum) {
      if (!window.ethereum.selectedAddress) {
        console.log("MetaMask не залогинен – запрашиваем аккаунты");
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }
    } else {
      alert("Инжектированный кошелек не найден. Установите MetaMask или используйте другой способ подключения.");
      return;
    }
    
    console.log("Открываем Web3Modal...");
    provider = await web3Modal.connect();
    console.log("Провайдер получен:", provider);

    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const accounts = await ethersProvider.listAccounts();
    console.log("Найденные аккаунты:", accounts);
    
    if (accounts.length === 0) {
      console.warn("Нет подключенных аккаунтов");
      return;
    }
    
    selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) {
      walletDisplay.innerText = selectedAccount;
    }
    console.log("Подключен аккаунт:", selectedAccount);

    provider.on("accountsChanged", (newAccounts) => {
      console.log("accountsChanged:", newAccounts);
      if (newAccounts.length === 0) {
        disconnectWallet();
      } else {
        selectedAccount = newAccounts[0];
        if (walletDisplay) walletDisplay.innerText = selectedAccount;
      }
    });

    provider.on("disconnect", () => {
      console.log("Провайдер отключился");
      disconnectWallet();
    });
    
  } catch (error) {
    if (error.message && error.message.includes("User Rejected")) {
      alert("Вы отклонили подключение кошелька. Нажмите 'Подключить кошелек' для авторизации.");
    }
    console.error("Ошибка подключения через Web3Modal:", error);
  }
}

async function disconnectWallet() {
  if (provider && provider.close) {
    await provider.close();
  }
  provider = null;
  selectedAccount = null;
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) {
    walletDisplay.innerText = "Wallet disconnected";
  }
  console.log("Кошелек отключен");
}

document.addEventListener("DOMContentLoaded", () => {
  const connectBtns = document.querySelectorAll("#connectWalletBtn, .connectWalletBtn");
  console.log("Найдено кнопок подключения:", connectBtns.length);
  if (connectBtns.length > 0) {
    connectBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Кнопка подключения нажата");
        connectWallet();
      });
    });
  } else {
    console.error("Элементы для подключения кошелька не найдены (id 'connectWalletBtn' или класс 'connectWalletBtn').");
  }
});

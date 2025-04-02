/**
 * wallet.js
 * Поддержка MetaMask и WalletConnect.
 */

console.log("wallet.js загружен");

let provider;
let selectedAccount;

const INFURA_KEY = "ВАШ_INFURA_ID";

// 1) Проверяем, как именно UMD-билд экспортирует WalletConnectProvider
const WalletConnectProviderConstructor = 
  (window.WalletConnectProvider && window.WalletConnectProvider.default)
    ? window.WalletConnectProvider.default
    : window.WalletConnectProvider;

const providerOptions = {
  walletconnect: {
    package: WalletConnectProviderConstructor,
    options: {
      infuraId: INFURA_KEY,
    }
  }
};

const web3Modal = new (window.Web3Modal.default || window.Web3Modal)({
  cacheProvider: false,
  providerOptions
});

// Подключение
async function connectWallet() {
  console.log("connectWallet() вызывается");
  try {
    // Проверяем MetaMask
    if (window.ethereum) {
      if (!window.ethereum.selectedAddress) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }
    } else {
      alert("MetaMask не найден. Установите расширение или используйте WalletConnect.");
      return;
    }
    
    console.log("Открываем Web3Modal...");
    provider = await web3Modal.connect();
    console.log("Провайдер получен:", provider);

    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const accounts = await ethersProvider.listAccounts();
    console.log("Аккаунты:", accounts);
    
    if (!accounts.length) {
      console.warn("Нет подключенных аккаунтов");
      return;
    }
    
    selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    provider.on("accountsChanged", (newAccounts) => {
      if (!newAccounts.length) {
        disconnectWallet();
      } else {
        selectedAccount = newAccounts[0];
        if (walletDisplay) walletDisplay.innerText = selectedAccount;
      }
    });

    provider.on("disconnect", () => {
      disconnectWallet();
    });
    
  } catch (error) {
    if (error.message && error.message.includes("User Rejected")) {
      alert("Вы отклонили подключение. Повторите попытку.");
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
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";
  console.log("Кошелек отключен");
}

document.addEventListener("DOMContentLoaded", () => {
  const connectBtns = document.querySelectorAll("#connectWalletBtn, .connectWalletBtn");
  connectBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      connectWallet();
    });
  });
});

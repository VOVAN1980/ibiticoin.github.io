/**
 * wallet.js
 * Реализует подключение криптовалютных кошельков через Web3Modal.
 * Поддерживаются: MetaMask, WalletConnect, Coinbase Wallet, Fortmatic, Torus.
 */

console.log("wallet.js загружен");

let provider;
let selectedAccount;

const INFURA_KEY = "1faccf0f1fdc4532ad7a1a38a67ee906";

const providerOptions = {
  walletconnect: {
    package: window.WalletConnectProvider, // Используем глобальное определение
    options: {
      infuraId: INFURA_KEY
    }
  },
  coinbasewallet: {
    package: window.CoinbaseWalletSDK, // Используем глобальное определение
    options: {
      appName: "IBITIcoin",
      infuraId: INFURA_KEY,
      rpc: "",
      chainId: 1,
      darkMode: false
    }
  },
  fortmatic: {
    package: window.Fortmatic, // Используем глобальное определение
    options: {
      key: "YOUR_FORTMATIC_KEY" // Замените на ваш Fortmatic ключ
    }
  },
  torus: {
    package: window.TorusEmbed, // Используем глобальное определение
    options: {
      network: "mainnet"
    }
  }
};

// Инициализируем Web3Modal через глобальный объект
const web3Modal = new window.Web3Modal({
  cacheProvider: false,
  providerOptions
});

async function connectWallet() {
  try {
    console.log("connectWallet() вызывается");
    provider = await web3Modal.connect();
    console.log("Провайдер получен:", provider);
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const accounts = await ethersProvider.listAccounts();
    console.log("Найденные аккаунты:", accounts);
    if (accounts.length === 0) {
      console.error("Нет подключенных аккаунтов");
      return;
    }
    selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) {
      walletDisplay.innerText = selectedAccount;
    }
    console.log("Подключен аккаунт:", selectedAccount);
    
    // Подписка на изменение аккаунтов
    provider.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        selectedAccount = accounts[0];
        if (walletDisplay) walletDisplay.innerText = selectedAccount;
      }
    });
    
    // Подписка на событие отключения
    provider.on("disconnect", () => {
      disconnectWallet();
    });
    
  } catch (error) {
    console.error("Ошибка подключения кошелька:", error);
    // Если пользователь отменил подключение, можно показать сообщение
    alert("Вы отклонили подключение кошелька. Пожалуйста, нажмите 'Подключить кошелек' для авторизации.");
  }
}

async function disconnectWallet() {
  if (provider && provider.close) {
    await provider.close();
    await web3Modal.clearCachedProvider();
  }
  provider = null;
  selectedAccount = null;
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";
  console.log("Кошелек отключен");
}

document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", () => {
      console.log("Кнопка подключения нажата");
      connectWallet();
    });
  } else {
    console.error("Элемент с id 'connectWalletBtn' не найден.");
  }
});

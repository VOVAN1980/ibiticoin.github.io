/**
 * wallet.js
 * Реализует подключение криптовалютных кошельков через Web3Modal.
 * Поддерживаются: MetaMask, WalletConnect (включая Trust Wallet), Coinbase Wallet, Fortmatic, Torus.
 *
 * Требуется:
 *  - ethers.js
 *  - Web3Modal
 *  - @walletconnect/web3-provider
 *  - @coinbase/wallet-sdk
 *  - Fortmatic
 *  - Torus
 *
 * (Поддержка Portis временно исключена)
 */

console.log("wallet.js загружен");

// Глобальные переменные для провайдера и выбранного аккаунта
let provider;
let selectedAccount;

// Используем один Infura ключ для всех случаев, где он требуется
const INFURA_KEY = "1faccf0f1fdc4532ad7a1a38a67ee906";

// Конфигурация провайдеров для Web3Modal (без Portis)
const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // Требуется @walletconnect/web3-provider
    options: {
      infuraId: INFURA_KEY
    }
  },
  coinbasewallet: {
    package: window.CoinbaseWalletSDK, // Используем глобальную переменную
    options: {
      appName: "IBITIcoin",
      infuraId: INFURA_KEY,
      rpc: "", // Оставьте пустым, если используете Infura
      chainId: 1,
      darkMode: false
    }
  },
  fortmatic: {
    package: Fortmatic, // Требуется Fortmatic
    options: {
      key: "YOUR_FORTMATIC_KEY" // Замените на ваш Fortmatic ключ
    }
  },
  torus: {
    package: window.TorusEmbed, // Используем глобальную переменную TorusEmbed
    options: {
      network: "mainnet"
    }
  }
};

// Инициализируем Web3Modal с заданными опциями
const web3Modal = new (Web3Modal.default || Web3Modal)({
  cacheProvider: false, // Если true, то запоминается выбранный кошелек
  providerOptions
});

// Функция подключения кошелька
async function connectWallet() {
  try {
    // Открываем модальное окно для выбора кошелька
    provider = await web3Modal.connect();
    
    // Создаем провайдер ethers на основе выбранного кошелька
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    
    // Получаем список аккаунтов
    const accounts = await ethersProvider.listAccounts();
    if (accounts.length === 0) {
      console.error("Нет подключенных аккаунтов");
      return;
    }
    selectedAccount = accounts[0];
    
    // Выводим адрес кошелька на странице (элемент с id="walletAddress")
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) {
      walletDisplay.innerText = selectedAccount;
    }
    console.log("Подключен аккаунт:", selectedAccount);
    
    // Подписываемся на события смены аккаунтов и отключения
    provider.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        selectedAccount = accounts[0];
        if (walletDisplay) walletDisplay.innerText = selectedAccount;
      }
    });
    
    provider.on("disconnect", () => {
      disconnectWallet();
    });
    
  } catch (error) {
    console.error("Ошибка подключения кошелька:", error);
  }
}

// Функция отключения кошелька
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

// Привязываем событие подключения к кнопке после загрузки страницы
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", connectWallet);
  } else {
    console.error("Элемент с id 'connectWalletBtn' не найден.");
  }
});

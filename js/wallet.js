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
    package: WalletConnectProvider,
    options: {
      infuraId: INFURA_KEY
    }
  },
  coinbasewallet: {
    package: window.CoinbaseWalletSDK,
    options: {
      appName: "IBITIcoin",
      infuraId: INFURA_KEY,
      rpc: "",
      chainId: 1,
      darkMode: false
    }
  },
  fortmatic: {
    package: Fortmatic,
    options: {
      key: "YOUR_FORTMATIC_KEY" // замените на ваш Fortmatic ключ
    }
  },
  torus: {
    package: window.TorusEmbed,
    options: {
      network: "mainnet"
    }
  }
};

// Добавляем disableInjectedProvider: false, чтобы даже при наличии MetaMask окно выбора появлялось
const web3Modal = new (Web3Modal.default || Web3Modal)({
  cacheProvider: false,
  disableInjectedProvider: false,
  providerOptions
});

async function connectWallet() {
  console.log("connectWallet() вызывается");
  try {
    if (!window.ethereum) {
      alert("MetaMask не установлен. Пожалуйста, установите MetaMask для подключения кошелька.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    console.log("Открываем Web3Modal...");
    // Открываем окно выбора кошелька
    provider = await web3Modal.connect();
    console.log("Web3Modal вернул провайдер:", provider);

    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const accounts = await ethersProvider.listAccounts();
    console.log("Найденные аккаунты:", accounts);
    
    if (accounts.length === 0) {
      console.warn("Нет подключенных аккаунтов. Возможно, вы отменили запрос в MetaMask.");
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
    if (error.message.includes("User Rejected")) {
      alert("Вы отклонили подключение кошелька. Пожалуйста, нажмите 'Подключить кошелек' для авторизации.");
    }
    console.error("Ошибка подключения через Web3Modal:", error);
  }
}

async function disconnectWallet() {
  if (provider && provider.close) {
    await provider.close();
    // По необходимости можно также вызвать: await web3Modal.clearCachedProvider();
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
  // Ищем кнопки подключения по id или классу "connectWalletBtn"
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

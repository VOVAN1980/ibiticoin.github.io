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
      rpc: "",
      chainId: 1,
      darkMode: false
    }
  },
  fortmatic: {
    package: Fortmatic, // Требуется Fortmatic
    options: {
      key: "YOUR_FORTMATIC_KEY" // замените на ваш Fortmatic ключ
    }
  },
  torus: {
    package: window.TorusEmbed, // Используем глобальную переменную TorusEmbed
    options: {
      network: "mainnet"
    }
  }
};

const web3Modal = new (Web3Modal.default || Web3Modal)({
  cacheProvider: false,
  providerOptions
});

async function connectWallet() {
  console.log("connectWallet() вызывается");
  try {
    if (!window.ethereum) {
      alert("MetaMask не установлен. Установите MetaMask для подключения кошелька.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    
    // Явно запрашиваем доступ к аккаунтам через MetaMask
    console.log("Запрашиваем аккаунты через MetaMask...");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    
    // Открываем Web3Modal для выбора кошелька
    console.log("Открываем Web3Modal...");
    provider = await web3Modal.connect();
    console.log("Web3Modal вернул провайдер:", provider);
    
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    
    // Явно запрашиваем доступ, если еще не получен
    await ethersProvider.send("eth_requestAccounts", []);
    
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
    
    provider.on("accountsChanged", (accounts) => {
      console.log("accountsChanged:", accounts);
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        selectedAccount = accounts[0];
        if (walletDisplay) walletDisplay.innerText = selectedAccount;
      }
    });
    
    provider.on("disconnect", () => {
      console.log("Провайдер отключился");
      disconnectWallet();
    });
    
  } catch (error) {
    console.error("Ошибка подключения кошелька:", error);
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
  if (walletDisplay) {
    walletDisplay.innerText = "Wallet disconnected";
  }
  console.log("Кошелек отключен");
}

document.addEventListener("DOMContentLoaded", () => {
  // Ищем элементы с id или классом "connectWalletBtn"
  const connectBtns = document.querySelectorAll("#connectWalletBtn, .connectWalletBtn");
  console.log("Найдено кнопок подключения:", connectBtns.length);
  if (connectBtns.length > 0) {
    connectBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        console.log("Кнопка подключения нажата");
        await connectWallet();
      });
    });
  } else {
    console.error("Элементы для подключения кошелька не найдены (id 'connectWalletBtn' или класс 'connectWalletBtn').");
  }
});

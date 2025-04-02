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

const web3Modal = new (Web3Modal.default || Web3Modal)({
  cacheProvider: false,
  providerOptions
});

async function connectWallet() {
  console.log("Попытка подключения кошелька через Web3Modal...");
  try {
    // Очистка кэша, чтобы окно выбора появилось всегда
    await web3Modal.clearCachedProvider();
    provider = await web3Modal.connect();
    console.log("Провайдер получен:", provider);

    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const accounts = await ethersProvider.listAccounts();
    console.log("Найденные аккаунты:", accounts);

    if (accounts.length > 0) {
      selectedAccount = accounts[0];
      const walletDisplay = document.getElementById("walletAddress");
      if (walletDisplay) {
        walletDisplay.textContent = selectedAccount;
      }
      console.log("Подключен аккаунт:", selectedAccount);
    } else {
      console.warn("Нет подключённых аккаунтов после выбора кошелька");
    }

    provider.on("accountsChanged", (newAccounts) => {
      console.log("accountsChanged:", newAccounts);
      if (newAccounts.length === 0) {
        disconnectWallet();
      } else {
        selectedAccount = newAccounts[0];
        const walletDisplay = document.getElementById("walletAddress");
        if (walletDisplay) {
          walletDisplay.textContent = selectedAccount;
        }
      }
    });

    provider.on("disconnect", () => {
      console.log("Провайдер отключился");
      disconnectWallet();
    });
  } catch (error) {
    console.error("Ошибка подключения через Web3Modal:", error);
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
    walletDisplay.textContent = "Wallet disconnected";
  }
  console.log("Кошелек отключен");
}

document.addEventListener("DOMContentLoaded", () => {
  // Ищем элементы с id или классом "connectWalletBtn"
  const connectBtns = document.querySelectorAll("#connectWalletBtn, .connectWalletBtn");
  console.log("Найдено кнопок подключения:", connectBtns.length);
  connectBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Кнопка подключения нажата");
      connectWallet();
    });
  });
});

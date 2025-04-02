/**
 * wallet.js
 * Использует Web3Modal для подключения кошелька (MetaMask, WalletConnect, и т.д.)
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
      key: "YOUR_FORTMATIC_KEY"
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
  console.log("connectWallet() вызывается");
  try {
    // Открываем Web3Modal — пользователь выберет кошелёк (MetaMask, WalletConnect и т.д.)
    console.log("Открываем Web3Modal...");
    provider = await web3Modal.connect();

    // Создаем ethers-провайдер
    const ethersProvider = new ethers.providers.Web3Provider(provider);

    // Получаем аккаунты, если пользователь выбрал MetaMask и разрешил доступ
    const accounts = await ethersProvider.listAccounts();
    console.log("Найденные аккаунты:", accounts);

    if (accounts.length === 0) {
      console.warn("Пользователь не разрешил доступ или аккаунтов нет");
      return;
    }

    selectedAccount = accounts[0];
    console.log("Подключён аккаунт:", selectedAccount);

    // Обновляем отображение адреса
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) {
      walletDisplay.innerText = selectedAccount;
    }

    // Следим за изменением аккаунтов
    provider.on("accountsChanged", (newAccounts) => {
      console.log("accountsChanged:", newAccounts);
      if (newAccounts.length === 0) {
        disconnectWallet();
      } else {
        selectedAccount = newAccounts[0];
        if (walletDisplay) walletDisplay.innerText = selectedAccount;
      }
    });

    // Следим за отключением
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

// Привязываем кнопку
document.addEventListener("DOMContentLoaded", () => {
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

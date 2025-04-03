console.log("wallet.js загружен");

let provider = null;
let selectedAccount = null;

const INFURA_ID = "1faccf0f1fdc4532ad7a1a38a67ee906"; // Заменить на настоящий

const WalletConnectProviderConstructor =
  window.WalletConnectProvider?.default || window.WalletConnectProvider;

const providerOptions = {
  walletconnect: {
    package: WalletConnectProviderConstructor,
    options: {
      infuraId: INFURA_ID
    }
  }
};

const web3Modal = new (window.Web3Modal?.default || window.Web3Modal)({
  cacheProvider: false,
  providerOptions
});

async function connectWallet() {
  try {
    console.log("Подключение кошелька...");

    provider = await web3Modal.connect();

    const web3Provider = new ethers.providers.Web3Provider(provider);
    const accounts = await web3Provider.listAccounts();

    if (!accounts.length) {
      console.warn("Нет аккаунтов");
      return;
    }

    selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    provider.on("accountsChanged", (accounts) => {
      if (!accounts.length) return disconnectWallet();
      selectedAccount = accounts[0];
      if (walletDisplay) walletDisplay.innerText = selectedAccount;
    });

    provider.on("disconnect", () => disconnectWallet());

    console.log("Кошелек подключен:", selectedAccount);
  } catch (err) {
    console.error("Ошибка подключения:", err);
    alert("Не удалось подключить кошелек.");
  }
}

async function disconnectWallet() {
  if (provider?.close) await provider.close();
  provider = null;
  selectedAccount = null;
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";
  console.log("Кошелек отключен");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#connectWalletBtn, .connectWalletBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      connectWallet();
    });
  });
});

// js/wallet.js
console.log("wallet.js загружен");

// -----------------------------
// 1) Глобальные переменные
// -----------------------------
let provider = null;
let signer = null;
let selectedAccount = null;

const INFURA_ID = "1faccf0f1fdc4532ad7a1a38a67ee906";
const projectId = "95f126f3a088cebcf781d2a1c10711fc";

// Адреса контрактов
const IBITI_TOKEN_ADDRESS      = "0xBCbB45CE07e6026Ed6A4911b2DCabd0544615fBe";
const NFTSALEMANAGER_ADDRESS   = "0xdBae91e49da7096f451C8D3db67E274EB5919e48";
const NFT_DISCOUNT_ADDRESS     = "0x680C093B347C7d6C2DAd24D4796e67eF9694096C";

// ABI
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";

// -----------------------------
// 2) Web3Modal v2 настройка
// -----------------------------
import { Web3Modal } from "@web3modal/html";
import { EthereumClient, modalConnectors, walletConnectProvider } from "@web3modal/ethereum";
import { configureChains, createClient } from "@wagmi/core";
import { mainnet } from "@wagmi/core/chains";
import { publicProvider } from "@wagmi/core/providers/public";

const chains = [mainnet];

const { provider: configuredProvider } = configureChains(chains, [
  walletConnectProvider({ projectId }),
  publicProvider(),
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({ appName: "IBITIcoin", chains }),
  provider: configuredProvider,
});

const ethereumClient = new EthereumClient(wagmiClient, chains);

const web3Modal = new Web3Modal({
  projectId,
  themeMode: "dark"
}, ethereumClient);

// -----------------------------
// 3) Подключение кошелька
// -----------------------------
async function connectWallet() {
  try {
    console.log("Подключение кошелька...");
    const instance = await web3Modal.connect(); // Открываем окно выбора кошелька
    const web3Provider = new ethers.providers.Web3Provider(instance);
    signer = web3Provider.getSigner();
    const accounts = await web3Provider.listAccounts();
    if (!accounts.length) return console.warn("Нет аккаунтов");

    selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    instance.on("accountsChanged", (accs) => {
      if (!accs.length) return disconnectWallet();
      selectedAccount = accs[0];
      if (walletDisplay) walletDisplay.innerText = selectedAccount;
    });
    instance.on("disconnect", () => disconnectWallet());

    console.log("Кошелек подключен:", selectedAccount);

    await initContracts(web3Provider);
  } catch (err) {
    console.error("Ошибка подключения:", err);
    alert("Ошибка подключения кошелька");
  }
}

// -----------------------------
// 4) Инициализация контрактов
// -----------------------------
async function initContracts(web3Provider) {
  const signer = web3Provider.getSigner();

  window.ibitiToken = new ethers.Contract(
    IBITI_TOKEN_ADDRESS,
    ibitiTokenAbi,
    signer
  );
  window.saleManager = new ethers.Contract(
    NFTSALEMANAGER_ADDRESS,
    nftSaleManagerAbi,
    signer
  );
  window.nftDiscount = new ethers.Contract(
    NFT_DISCOUNT_ADDRESS,
    nftDiscountAbi,
    signer
  );

  console.log("Контракты инициализированы");
}

// -----------------------------
// 5) Отключение
// -----------------------------
async function disconnectWallet() {
  if (provider?.close) await provider.close();
  provider = null;
  signer = null;
  selectedAccount = null;
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";
  console.log("Кошелек отключен");
}

// -----------------------------
// 6) Обработчик кнопки подключения
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", (e) => {
      e.preventDefault();
      connectWallet();
    });
  }
});

// -----------------------------
// 7) Экспорт
// -----------------------------
export { connectWallet, disconnectWallet, provider, signer, selectedAccount };

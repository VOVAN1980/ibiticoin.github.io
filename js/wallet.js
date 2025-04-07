// js/wallet.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import { Web3Modal } from '@web3modal/html';
import { EthereumClient, walletConnectProvider, modalConnectors } from '@web3modal/ethereum';
import { configureChains, createClient } from '@wagmi/core';
import { mainnet } from '@wagmi/core/chains';
import { publicProvider } from '@wagmi/core/providers/public';

// Глобальные переменные
let provider = null;
let signer = null;
let selectedAccount = null;

// Адреса контрактов (оставляем как были)
const IBITI_TOKEN_ADDRESS    = "0xBCbB45CE07e6026Ed6A4911b2DCabd0544615fBe";
const NFTSALEMANAGER_ADDRESS = "0xdBae91e49da7096f451C8D3db67E274EB5919e48";
const NFT_DISCOUNT_ADDRESS   = "0x680C093B347C7d6C2DAd24D4796e67eF9694096C";

// ABI импортируем, как раньше
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi } from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi } from "./abis/nftDiscountAbi.js";

// Настройка сети и создание клиента для Web3Modal v2
const chains = [mainnet];
const projectId = '95f126f3a088cebcf781d2a1c10711fc';  // ваш projectId

const { provider: wagmiProvider } = configureChains(chains, [
  walletConnectProvider({ projectId }),
  publicProvider()
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({ appName: 'IBITIcoin', chains }),
  provider: wagmiProvider
});

const ethereumClient = new EthereumClient(wagmiClient, chains);

export const web3Modal = new Web3Modal({
  projectId,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent-color': '#ff007a',
    '--w3m-background-color': '#1a1a1a'
  }
}, ethereumClient);

// Функция подключения кошелька
async function connectWallet() {
  try {
    console.log("Подключение кошелька...");
    // Открываем модальное окно
    await web3Modal.openModal();
    
    // Используем поставщика из wagmiClient для получения провайдера
    const web3Provider = new ethers.providers.Web3Provider(await wagmiClient.provider);
    signer = web3Provider.getSigner();
    const accounts = await web3Provider.listAccounts();
    if (!accounts.length) {
      console.warn("Нет аккаунтов");
      return;
    }
    selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    // Подписываемся на изменения аккаунта и отключение
    provider = await wagmiClient.provider;
    provider.on("accountsChanged", (accs) => {
      if (!accs.length) return disconnectWallet();
      selectedAccount = accs[0];
      if (walletDisplay) walletDisplay.innerText = selectedAccount;
    });
    provider.on("disconnect", () => disconnectWallet());

    console.log("Кошелек подключен:", selectedAccount);
    await initContracts(web3Provider);
  } catch (err) {
    console.error("Ошибка подключения:", err);
    alert("Ошибка подключения кошелька");
  }
}

// Функция инициализации контрактов
async function initContracts(web3Provider) {
  const signerInstance = web3Provider.getSigner();

  window.ibitiToken = new ethers.Contract(
    IBITI_TOKEN_ADDRESS,
    ibitiTokenAbi,
    signerInstance
  );
  window.saleManager = new ethers.Contract(
    NFTSALEMANAGER_ADDRESS,
    nftSaleManagerAbi,
    signerInstance
  );
  window.nftDiscount = new ethers.Contract(
    NFT_DISCOUNT_ADDRESS,
    nftDiscountAbi,
    signerInstance
  );

  console.log("Контракты инициализированы");
}

// Функция отключения кошелька
async function disconnectWallet() {
  await web3Modal.clearCachedProvider();
  provider = null;
  signer = null;
  selectedAccount = null;
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";
  console.log("Кошелек отключен");
}

// Обработчик кнопки подключения (не меняется)
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", (e) => {
      e.preventDefault();
      connectWallet();
    });
  }
});

// Экспортируем функции и переменные
export { connectWallet, disconnectWallet, signer, selectedAccount };


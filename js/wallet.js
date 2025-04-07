// js/wallet.js
import { Web3Modal } from '@web3modal/html';
import { EthereumClient, walletConnectProvider, modalConnectors } from '@web3modal/ethereum';
import { configureChains, createClient } from '@wagmi/core';
import { bscTestnet } from '@wagmi/core/chains'; // можно заменить на mainnet или другую сеть
import { publicProvider } from '@wagmi/core/providers/public';
import { ethers } from 'ethers';

import { ibitiTokenAbi } from './abis/ibitiTokenAbi.js';
import { nftSaleManagerAbi } from './abis/nftSaleManagerAbi.js';
import { nftDiscountAbi } from './abis/nftDiscountAbi.js';

console.log("wallet.js (v2) загружен");

// -----------------------------
// 1) Сеть и ProjectID
// -----------------------------
const chains = [bscTestnet]; // или mainnet, если идёшь в прод
const projectId = '95f126f3a088cebcf781d2a1c10711fc'; // твой WalletConnect ID

// -----------------------------
// 2) Создание клиента
// -----------------------------
const { provider } = configureChains(chains, [
  walletConnectProvider({ projectId }),
  publicProvider()
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({ appName: 'IBITIcoin', chains }),
  provider
});

const ethereumClient = new EthereumClient(wagmiClient, chains);

export const web3Modal = new Web3Modal({
  projectId,
  themeMode: 'dark'
}, ethereumClient);

// -----------------------------
// 3) Глобальные переменные
// -----------------------------
let signer = null;
let selectedAccount = null;

// Контракты
const IBITI_TOKEN_ADDRESS = '0x5fab4e25c0E75aB4a50Cac19Bf62f58dB8E597c6';
const NFTSALEMANAGER_ADDRESS = '0xf2A9cB2F09C1f1A8103441D13a78330B028a41DA';
const NFT_DISCOUNT_ADDRESS = '0x776D125B0abf3a6B10d446e9F8c0a96bBDcbC511';

// -----------------------------
// 4) Подключение кошелька
// -----------------------------
async function connectWallet() {
  try {
    const provider = await wagmiClient.provider;
    const web3Provider = new ethers.providers.Web3Provider(provider);
    signer = web3Provider.getSigner();

    const accounts = await web3Provider.listAccounts();
    if (!accounts.length) return console.warn("Нет аккаунтов");

    selectedAccount = accounts[0];
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    initContracts(web3Provider);

    provider.on("accountsChanged", (accs) => {
      if (!accs.length) return disconnectWallet();
      selectedAccount = accs[0];
      if (walletDisplay) walletDisplay.innerText = selectedAccount;
    });

    provider.on("disconnect", () => disconnectWallet());

    console.log("Кошелёк подключен:", selectedAccount);
  } catch (err) {
    console.error("Ошибка подключения:", err);
  }
}

// -----------------------------
// 5) Инициализация контрактов
// -----------------------------
function initContracts(web3Provider) {
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
// 6) Отключение
// -----------------------------
async function disconnectWallet() {
  await web3Modal.clearCachedProvider();
  signer = null;
  selectedAccount = null;
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Wallet disconnected";
  console.log("Кошелёк отключен");
}

// -----------------------------
// 7) Обработчик кнопки
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
// 8) Экспорт
// -----------------------------
export {
  connectWallet,
  disconnectWallet,
  signer,
  selectedAccount
};

import { Web3Modal } from 'https://unpkg.com/@web3modal/html@2.7.1/dist/index.js';
import { EthereumClient, w3mConnectors, w3mProvider } from 'https://unpkg.com/@web3modal/ethereum@2.7.1/dist/index.js';
import { bscTestnet } from 'https://cdn.skypack.dev/@wagmi/core/chains';
import { createConfig, getAccount, watchAccount } from 'https://cdn.skypack.dev/@wagmi/core';
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// Project ID
const projectId = '95f126f3a088...d2a1c10711fc';

// Сеть
const chains = [bscTestnet];

// Конфиг
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient: w3mProvider({ projectId }),
});

// Web3Modal init
const ethereumClient = new EthereumClient(wagmiConfig, chains);
const modal = new Web3Modal({
  projectId,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#FFD700',
    '--w3m-background': '#000000'
  }
}, ethereumClient);

// Подключение
async function connectWallet() {
  const account = getAccount();
  if (account?.address) return;
  modal.openModal();
}

// Обновление UI
function updateWalletUI(address) {
  const btn = document.getElementById('walletAddress');
  if (!btn) return;
  btn.innerText = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : 'Подключить кошелёк';
}

// Слежение за аккаунтом
watchAccount((account) => {
  updateWalletUI(account.address);
  window.connectedAddress = account.address;
  if (window.ethereum) {
    window.signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
  }
});

// Навешивание обработчика
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('walletAddress');
  if (btn) btn.addEventListener('click', connectWallet);
});

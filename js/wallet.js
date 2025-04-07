// js/wallet.js
import { Web3Modal } from 'https://unpkg.com/@web3modal/html@2.7.1/dist/index.js';
import { EthereumClient, w3mConnectors, w3mProvider } from 'https://unpkg.com/@web3modal/ethereum@2.7.1/dist/index.js';
import { createConfig, configureChains, getAccount, watchAccount } from 'https://unpkg.com/@wagmi/core@2.5.6/dist/index.js';
import { bscTestnet } from 'https://unpkg.com/@wagmi/core@2.5.6/chains/index.js';
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// 🔑 Твой Project ID
const projectId = '95f126f3a088cebcf781d2a1c10711fc'; // Укажи реальный ID

// 🌐 Сеть
const chains = [bscTestnet];
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

// ⚙️ Wagmi конфиг
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
});

// 🦊 Web3Modal
const ethereumClient = new EthereumClient(wagmiConfig, chains);
const modal = new Web3Modal({ projectId, themeMode: 'dark' }, ethereumClient);

// 👛 Обновление кнопки
function updateWalletUI(address) {
  const btn = document.getElementById('walletAddress');
  if (!btn) return;

  if (!address) {
    btn.innerText = 'Подключить кошелёк';
  } else {
    btn.innerText = `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

// ⚡ Подключение
async function connectWallet() {
  try {
    modal.openModal();
  } catch (err) {
    console.error('Ошибка при подключении:', err);
  }
}

// 🟢 Отслеживание подключения
watchAccount((account) => {
  updateWalletUI(account.address);
  if (window.ethereum && account.address) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    window.signer = provider.getSigner();
    window.connectedAddress = account.address;
  }
});

// 📎 Навешиваем кнопку
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('walletAddress');
  if (btn) {
    btn.addEventListener('click', connectWallet);
  }
});

import { EthereumClient, w3mConnectors, w3mProvider } from 'https://cdn.jsdelivr.net/npm/@web3modal/ethereum@2.7.1/+esm';
import { Web3Modal } from 'https://cdn.jsdelivr.net/npm/@web3modal/html@2.7.1/+esm';
import { createConfig, getAccount, watchAccount } from 'https://cdn.jsdelivr.net/npm/@wagmi/core@2.6.1/+esm';
import { bscTestnet } from 'https://cdn.jsdelivr.net/npm/@wagmi/core@2.6.1/chains/+esm';
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// ✅ Укажи актуальный Project ID Reown (ex-Web3Modal)
const projectId = '95f126f3a088...d2a1c10711fc';

// 🔗 Сеть (можно заменить на mainnet или другую при необходимости)
const chains = [bscTestnet];

// 🔧 Конфигурация Wagmi
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient: w3mProvider({ projectId }),
  chains
});

// ⚙️ Клиент и модалка
const ethereumClient = new EthereumClient(wagmiConfig, chains);
const web3Modal = new Web3Modal({ projectId, themeMode: 'dark' }, ethereumClient);

// 👛 Подключение кошелька
async function connectWallet() {
  try {
    const account = getAccount();
    if (account?.address) return;
    web3Modal.openModal();
  } catch (err) {
    console.error('Ошибка подключения:', err);
  }
}

// 🔁 Обновление интерфейса
function updateWalletUI(address) {
  const btn = document.getElementById('walletAddress');
  if (!btn) return;
  btn.innerText = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Подключить кошелёк';
}

// 📡 Отслеживание состояния
watchAccount((account) => {
  updateWalletUI(account.address);
  window.connectedAddress = account.address || null;
  window.signer = account.address ? new ethers.providers.Web3Provider(window.ethereum).getSigner() : null;
});

// ⏱️ Навешиваем кнопку
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('walletAddress');
  if (btn) btn.addEventListener('click', connectWallet);
});

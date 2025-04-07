import { EthereumClient, w3mConnectors, w3mProvider } from 'https://cdn.jsdelivr.net/npm/@web3modal/ethereum/+esm';
import { Web3Modal } from 'https://cdn.jsdelivr.net/npm/@web3modal/html/+esm';
import { createConfig, getAccount, watchAccount } from 'https://cdn.jsdelivr.net/npm/@wagmi/core/+esm';
import { bscTestnet } from 'https://cdn.jsdelivr.net/npm/@wagmi/core/chains/+esm';
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// ⚙️ Настройки
const projectId = '95f126f3a088...d2a1c10711fc'; // Замени на свой актуальный Project ID
const chains = [bscTestnet]; // Используем тестовую сеть BSC

// 💼 Конфигурация Wagmi
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient: w3mProvider({ projectId }),
  chains
});

// 🔌 Инициализация Web3Modal и EthereumClient
const ethereumClient = new EthereumClient(wagmiConfig, chains);
const modal = new Web3Modal({ projectId, themeMode: 'dark' }, ethereumClient);

// 📡 Функция для подключения кошелька
async function connectWallet() {
  try {
    const account = getAccount();
    if (account?.address) return; // Уже подключено

    modal.openModal();
  } catch (err) {
    console.error('Ошибка подключения:', err);
  }
}

// 👛 Обновление интерфейса после подключения
function updateWalletUI(address) {
  const btn = document.getElementById('walletAddress');
  if (!btn) return;

  if (!address) {
    btn.innerText = 'Подключить кошелёк';
  } else {
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
    btn.innerText = short;
  }
}

// 🔁 Отслеживание состояния подключения
watchAccount((account) => {
  updateWalletUI(account.address);
  window.connectedAddress = account.address;
  window.signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
});

// 🎯 Добавление обработчика события для кнопки подключения
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('walletAddress');
  if (btn) {
    btn.addEventListener('click', connectWallet);
  }
});

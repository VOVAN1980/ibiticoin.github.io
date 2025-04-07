import { EthereumClient, w3mConnectors, w3mProvider } from 'https://unpkg.com/@web3modal/ethereum@2.7.1/dist/ethereum.js';
import { Web3Modal } from 'https://unpkg.com/@web3modal/html@2.7.1/dist/html.js';
import { configureChains, createConfig, getAccount, watchAccount } from 'https://unpkg.com/@wagmi/core@1.4.10/dist/index.js';
import { mainnet, bsc, bscTestnet } from 'https://unpkg.com/@wagmi/core@1.4.10/dist/chains.js';
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// ⚙️ Настройки сети и Project ID от Web3Modal
const projectId = '95f126f3a088...d2a1c10711fc'; // вставь сюда свой актуальный Project ID
const chains = [bscTestnet]; // можно заменить на bsc или mainnet при необходимости

// 💼 Конфигурация WAGMI
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
});

// 🔌 Web3Modal и Ethereum Client
const ethereumClient = new EthereumClient(wagmiConfig, chains);
const modal = new Web3Modal({ projectId, themeMode: 'dark' }, ethereumClient);

// 📡 Подключение и отображение кошелька
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

// 🔁 Отслеживание подключения
watchAccount((account) => {
  updateWalletUI(account.address);
  window.connectedAddress = account.address;
  window.signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
});

// 🎯 Навешиваем обработчик на кнопку
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('walletAddress');
  if (btn) {
    btn.addEventListener('click', connectWallet);
  }
});

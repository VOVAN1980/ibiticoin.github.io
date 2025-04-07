import { EthereumClient, w3mConnectors, w3mProvider } from 'https://cdn.jsdelivr.net/npm/@web3modal/ethereum/+esm';
import { Web3Modal } from 'https://cdn.jsdelivr.net/npm/@web3modal/html/+esm';
import { configureChains, createConfig, getAccount, watchAccount } from 'https://cdn.jsdelivr.net/npm/@wagmi/core/+esm';
import { bscTestnet } from 'https://cdn.jsdelivr.net/npm/@wagmi/core/chains/+esm';
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// ✅ Замени на свой проект ID
const projectId = '95f126f3a088...d2a1c10711fc';

// ✅ Настройка сети
const chains = [bscTestnet];

// ⚙️ Настройка Wagmi + Web3Modal
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient: w3mProvider({ projectId }),
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);

const modal = new Web3Modal(
  {
    projectId,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#FFD700',
      '--w3m-background': '#000',
      '--w3m-font-size-master': '16px'
    }
  },
  ethereumClient
);

// 📡 Подключение
async function connectWallet() {
  try {
    const account = getAccount();
    if (account?.address) return;

    modal.openModal();
  } catch (err) {
    console.error('Ошибка подключения:', err);
  }
}

// 🔁 Обновление интерфейса
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

// 🔌 Слушатель состояния
watchAccount((account) => {
  updateWalletUI(account.address);
  window.connectedAddress = account.address;
  window.signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
});

// 🎯 Кнопка подключения
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('walletAddress');
  if (btn) {
    btn.addEventListener('click', connectWallet);
  }
});

import { EthereumClient, w3mConnectors, w3mProvider } from 'https://cdn.jsdelivr.net/npm/@web3modal/ethereum@2.7.1/+esm';
import { Web3Modal } from 'https://cdn.jsdelivr.net/npm/@web3modal/html@2.7.1/+esm';
import { createConfig, getAccount, watchAccount } from 'https://cdn.jsdelivr.net/npm/@wagmi/core@2.5.6/+esm';
import { bscTestnet } from 'https://cdn.jsdelivr.net/npm/@wagmi/core@2.5.6/chains/+esm';
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// ⚙️ Project ID Reown
const projectId = '95f126f3a088...d2a1c10711fc'; // Замени на свой

// 🔗 Сеть
const chains = [bscTestnet];

// ⚙️ Wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient: w3mProvider({ projectId }),
});

// 🔌 Web3Modal
const ethereumClient = new EthereumClient(wagmiConfig, chains);
const modal = new Web3Modal(
  {
    projectId,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#FFD700',
      '--w3m-background': '#000000',
    },
  },
  ethereumClient
);

// 📡 Подключение кошелька
async function connectWallet() {
  try {
    const account = getAccount();
    if (account?.address) return;
    modal.openModal();
  } catch (err) {
    console.error('Ошибка подключения:', err);
  }
}

// 👛 UI
function updateWalletUI(address) {
  const btn = document.getElementById('walletAddress');
  if (!btn) return;
  btn.innerText = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : 'Подключить кошелёк';
}

// 🔄 Слежение
watchAccount((account) => {
  updateWalletUI(account.address);
  window.connectedAddress = account.address;
  if (window.ethereum) {
    window.signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
  }
});

// ▶️ DOM
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('walletAddress');
  if (btn) btn.addEventListener('click', connectWallet);
});

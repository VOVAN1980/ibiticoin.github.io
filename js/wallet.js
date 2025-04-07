import { EthereumClient, w3mConnectors, w3mProvider } from 'https://cdn.jsdelivr.net/npm/@web3modal/ethereum/+esm';
import { Web3Modal } from 'https://cdn.jsdelivr.net/npm/@web3modal/html/+esm';
import { configureChains, createConfig, getAccount, watchAccount } from 'https://cdn.jsdelivr.net/npm/@wagmi/core/+esm';
import { mainnet, bsc, bscTestnet } from 'https://cdn.jsdelivr.net/npm/@wagmi/core/chains/+esm';
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// Project ID Reown
const projectId = '95f126f3a088...d2a1c10711fc'; // замени на свой актуальный

const chains = [bscTestnet]; // при необходимости — mainnet или bsc
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);
const modal = new Web3Modal({ projectId }, ethereumClient);

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

function connectWallet() {
  modal.openModal();
}

watchAccount((account) => {
  updateWalletUI(account.address);
  window.connectedAddress = account.address;
  window.signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
});

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('walletAddress');
  if (btn) {
    btn.addEventListener('click', connectWallet);
  }
});

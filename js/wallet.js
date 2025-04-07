// js/wallet.js
import { createWeb3Modal, defaultWagmiConfig } from 'https://cdn.jsdelivr.net/npm/@reown/appkit@1/+esm';
import { bscTestnet } from 'https://cdn.jsdelivr.net/npm/@wagmi/core/chains/+esm';
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

const projectId = '95f126f3a088...d2a1c10711fc'; // Заменить на актуальный если обрезан

const metadata = {
  name: 'IBITIcoin',
  description: 'IBITIcoin – новая эра Web3',
  url: 'https://www.ibiticoin.com',
  icons: ['https://www.ibiticoin.com/img/logo.png']
};

// Конфигурация Wagmi
const config = defaultWagmiConfig({
  chains: [bscTestnet],
  projectId,
  metadata
});

// Инициализация Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains: [bscTestnet],
  themeMode: 'dark'
});

// Обновление интерфейса
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

// Отслеживание состояния
import { watchAccount, getAccount } from 'https://cdn.jsdelivr.net/npm/@wagmi/core/+esm';

watchAccount((account) => {
  if (account?.address) {
    window.connectedAddress = account.address;
    window.signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
  } else {
    window.connectedAddress = null;
    window.signer = null;
  }

  updateWalletUI(account.address);
});

// Подключение по клику
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('walletAddress');
  if (btn) {
    btn.addEventListener('click', async () => {
      const { open } = await import('https://cdn.jsdelivr.net/npm/@reown/appkit@1/+esm');
      open(); // Открыть окно подключения
    });

    // Первичная отрисовка
    const account = getAccount();
    updateWalletUI(account.address);
  }
});

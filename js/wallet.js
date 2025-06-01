// js/wallet.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import Web3Modal from "web3modal";
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi } from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi } from "./abis/nftDiscountAbi.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";

console.log("✅ wallet.js загружен");

let provider = null;
let signer = null;
let selectedAccount = null;

const INFURA_ID = "1faccf0f1fdc4532ad7a1a38a67ee906";
const IBITI_TOKEN_ADDRESS      = "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196";
const NFTSALEMANAGER_ADDRESS   = "0x5572F3AE84319Fbd6e285a0CB854f92Afd31dd6D";
const NFT_DISCOUNT_ADDRESS     = "0x26C4E3D3E40943D2d569e832A243e329E14ecb02";
const PHASED_TOKENSALE_ADDRESS = "0x3092cFDfF6890F33b3227c3d2740F84772A465c7";

// 2) Web3Modal настройка с cacheProvider: true
const providerOptions = {
  walletconnect: {
    package: window.WalletConnectProvider?.default || window.WalletConnectProvider,
    options: { infuraId: INFURA_ID }
  }
};

const web3Modal = new Web3Modal({
  cacheProvider: true,     // ⚠️ включаем кэширование провайдера
  providerOptions
});

export async function connectWallet() {
  try {
    if (window.ethereum) {
      // пробуем переключиться на BSC (при желании)
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x38",
              chainName: "Binance Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: ["https://bsc-dataseed.binance.org/"],
              blockExplorerUrls: ["https://bscscan.com"]
            }]
          });
        } else {
          console.error("Ошибка переключения сети:", switchError);
        }
      }
    }

    console.log("🔌 Подключение кошелька...");
    const rawProvider = await web3Modal.connect();
    const web3Provider = new ethers.BrowserProvider(rawProvider);
    signer = await web3Provider.getSigner();
    provider = web3Provider;

    selectedAccount = await signer.getAddress();
    const walletDisplay = document.getElementById("walletAddress");
    if (walletDisplay) walletDisplay.innerText = selectedAccount;

    // Инициализируем контракты и выводим баланс
    await initContracts();
    await showIbitiBalance(true);

    rawProvider.on("accountsChanged", async (accs) => {
      if (!accs.length) {
        await disconnectWallet();
      } else {
        selectedAccount = accs[0];
        if (walletDisplay) walletDisplay.innerText = selectedAccount;
        await showIbitiBalance(true);
      }
    });
    rawProvider.on("disconnect", () => disconnectWallet());

    console.log("✅ Кошелек подключен:", selectedAccount);
    return selectedAccount;
  } catch (err) {
    console.error("❌ Ошибка подключения:", err);
    throw err;
  }
}

async function initContracts() {
  window.ibitiToken  = new ethers.Contract(IBITI_TOKEN_ADDRESS,      ibitiTokenAbi,      signer);
  window.saleManager = new ethers.Contract(NFTSALEMANAGER_ADDRESS,   nftSaleManagerAbi,  signer);
  window.nftDiscount = new ethers.Contract(NFT_DISCOUNT_ADDRESS,     nftDiscountAbi,     signer);
  window.phasedSale  = new ethers.Contract(PHASED_TOKENSALE_ADDRESS, PhasedTokenSaleAbi, signer);
  console.log("✅ Контракты инициализированы");
}

export async function showIbitiBalance(highlight = false) {
  if (!window.ibitiToken || !selectedAccount) return;
  try {
    const balance = await window.ibitiToken.balanceOf(selectedAccount);
    const formatted = ethers.formatUnits(balance, 8);
    const el = document.getElementById("ibitiBalance");
    if (el) {
      el.innerText = `Ваш баланс IBITI: ${formatted}`;
      if (highlight) {
        el.style.transition = "background 0.3s ease";
        el.style.background = "rgba(255, 215, 0, 0.2)";
        setTimeout(() => (el.style.background = "transparent"), 500);
      }
    }
  } catch (err) {
    console.error("Ошибка при получении баланса:", err);
  }
}

export async function disconnectWallet() {
  if (provider?.provider?.disconnect) {
    await provider.provider.disconnect();
  }
  provider = null;
  signer = null;
  selectedAccount = null;

  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = "Disconnected";
  const el = document.getElementById("ibitiBalance");
  if (el) el.innerText = "";

  // Сбрасываем кэш провайдера (Web3Modal) при отключении
  await web3Modal.clearCachedProvider();

  console.log("🔌 Кошелек отключен");
}

// При загрузке страницы – если провайдер был закэширован, пробуем восстановить подключение
document.addEventListener("DOMContentLoaded", async () => {
  if (web3Modal.cachedProvider) {
    try {
      await connectWallet();
    } catch (e) {
      console.warn("Не удалось автоматически восстановить подключение кошелька:", e);
    }
  }
});

// Чтобы другие модули могли проверить, подключён ли кошелёк
export { selectedAccount };

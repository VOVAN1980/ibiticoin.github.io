// js/wallet.js
console.log("✅ wallet.js загружен");

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import Web3Modal from "https://unpkg.com/web3modal@1.9.8/dist/index.js";
import WalletConnectProviderConstructor from "https://unpkg.com/@walletconnect/web3-provider@1.6.6/dist/umd/index.min.js";

// ABI
import { ibitiTokenAbi }         from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }     from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }        from "./abis/nftDiscountAbi.js";
import { phasedTokenSaleAbi }    from "./abis/phasedTokenSaleAbi.js";
import erc20Abi                  from "./abis/erc20Abi.js";

// -----------------------------
// 1) Глобальные переменные
// -----------------------------
let provider   = null;
let signer     = null;
let selectedAccount = null;

const INFURA_ID                  = "1faccf0f1fdc4532ad7a1a38a67ee906";

// Ваши адреса контрактов (скопируйте реальные после деплоя)
const IBITI_TOKEN_ADDRESS        = "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196";
const NFTSALEMANAGER_ADDRESS     = "0x5572F3AE84319Fbd6e285a0CB854f92Afd31dd6D";
const NFT_DISCOUNT_ADDRESS       = "0x26C4E3D3E40943D2d569e832A243e329E14ecb02";
const PHASED_TOKENSALE_ADDRESS   = "0xB2DB398dC13FFb1E07306f96aE359dE5f265eFF1";
const USDT_TOKEN_ADDRESS         = "0x55d398326f99059fF775485246999027B3197955";

// -----------------------------
// 2) Web3Modal настройка
// -----------------------------
const providerOptions = {
  walletconnect: {
    package: WalletConnectProviderConstructor,
    options: { infuraId: INFURA_ID }
  }
};

const web3Modal = new Web3Modal({
  cacheProvider: false,
  providerOptions
});

// -----------------------------
// 3) Подключение кошелька и сеть BSC
// -----------------------------
async function connectWallet() {
  try {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }]    // BSC Mainnet
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
          return;
        }
      }
    }

    console.log("🔌 Подключение кошелька...");
    provider = await web3Modal.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);
    signer = web3Provider.getSigner();

    const accounts = await web3Provider.listAccounts();
    if (!accounts.length) return console.warn("❌ Нет аккаунтов");

    selectedAccount = accounts[0];
    document.getElementById("walletAddress").innerText = selectedAccount;

    provider.on("accountsChanged", async (accs) => {
      if (!accs.length) return disconnectWallet();
      selectedAccount = accs[0];
      document.getElementById("walletAddress").innerText = selectedAccount;
      await showIbitiBalance(true);
    });

    provider.on("disconnect", () => disconnectWallet());

    console.log("✅ Кошелек подключен:", selectedAccount);

    await initContracts(web3Provider);
    await showIbitiBalance(true);
  } catch (err) {
    console.error("❌ Ошибка подключения:", err);
    alert("Ошибка подключения кошелька");
  }
}

// -----------------------------
// 4) Инициализация контрактов
// -----------------------------
async function initContracts(web3Provider) {
  const signer = web3Provider.getSigner();

  window.ibitiToken = new ethers.Contract(
    IBITI_TOKEN_ADDRESS,
    ibitiTokenAbi,
    signer
  );
  window.saleManager = new ethers.Contract(
    NFTSALEMANAGER_ADDRESS,
    nftSaleManagerAbi,
    signer
  );
  window.nftDiscount = new ethers.Contract(
    NFT_DISCOUNT_ADDRESS,
    nftDiscountAbi,
    signer
  );

  // PhasedTokenSale — ваш основной контракт продажи
  window.saleContract = new ethers.Contract(
    PHASED_TOKENSALE_ADDRESS,
    phasedTokenSaleAbi,
    signer
  );
  console.log("🔹 PhasedTokenSale:", window.saleContract.address);

  // USDT для оплаты
  window.USDTToken = new ethers.Contract(
    USDT_TOKEN_ADDRESS,
    erc20Abi,
    signer
  );
  console.log("🔹 USDTToken:", window.USDTToken.address);

  console.log("✅ Все контракты инициализированы");
}

// -----------------------------
// 5) Показ баланса IBITI
// -----------------------------
async function showIbitiBalance(highlight = false) {
  if (!window.ibitiToken || !selectedAccount) return;
  try {
    const balance = await window.ibitiToken.balanceOf(selectedAccount);
    const formatted = ethers.utils.formatUnits(balance, 8);
    const el = document.getElementById("ibitiBalance");
    el.innerText = `Ваш баланс IBITI: ${formatted}`;
    if (highlight) {
      el.style.transition = "background 0.3s";
      el.style.background = "rgba(255,215,0,0.2)";
      setTimeout(() => el.style.background = "transparent", 500);
    }
  } catch (err) {
    console.error("Ошибка при получении баланса:", err);
  }
}

// -----------------------------
// 6) Отключение кошелька
// -----------------------------
async function disconnectWallet() {
  if (provider?.close) await provider.close();
  provider = null;
  signer = null;
  selectedAccount = null;

  document.getElementById("walletAddress").innerText = "Wallet disconnected";
  document.getElementById("ibitiBalance").innerText = "";
  console.log("🔌 Кошелек отключен");
}

// -----------------------------
// 7) Обработчик кнопки подключения
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", (e) => {
      e.preventDefault();
      connectWallet();
    });
  }
});

// -----------------------------
// 8) Экспорт функций
// -----------------------------
export { connectWallet, disconnectWallet, provider };

// js/wallet.js
console.log("✅ wallet.js загружен");

// -----------------------------
// 0) Подключаем ethers как модуль ESM
// -----------------------------
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

// -----------------------------
// 1) Глобальные переменные
// -----------------------------
let provider = null;
let signer   = null;
let selectedAccount = null;

// -----------------------------
// 2) Адреса ваших контрактов
// -----------------------------
// (замените на свои реальные адреса из .env)
const IBITI_TOKEN_ADDRESS       = "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196";
const NFTSALEMANAGER_ADDRESS    = "0x5572F3AE84319Fbd6e285a0CB854f92Afd31dd6D";
const NFT_DISCOUNT_ADDRESS      = "0x26C4E3D3E40943D2d569e832A243e329E14ecb02";
const PHASED_TOKENSALE_ADDRESS  = "0xB2DB398dC13FFb1E07306f96aE359dE5f265eFF1";
const USDT_TOKEN_ADDRESS        = "0x55d398326f99059fF775485246999027B3197955";

// -----------------------------
// 3) ABI импорт
// -----------------------------
import { ibitiTokenAbi }       from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }   from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }      from "./abis/nftDiscountAbi.js";
import { phasedTokenSaleAbi }  from "./abis/phasedTokenSaleAbi.js";
import erc20Abi                from "./abis/erc20Abi.js";

// -----------------------------
// 4) Web3Modal настройка
// -----------------------------
const providerOptions = {
  walletconnect: {
    package: window.WalletConnectProvider?.default || window.WalletConnectProvider,
    options: { infuraId: "1faccf0f1fdc4532ad7a1a38a67ee906" }
  }
};
const web3Modal = new (window.Web3Modal?.default || window.Web3Modal)({
  cacheProvider: false,
  providerOptions
});

// -----------------------------
// 5) Подключение кошелька
// -----------------------------
async function connectWallet() {
  try {
    // переключаем на BSC Mainnet
    if (window.ethereum) {
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
    provider.on("disconnect", disconnectWallet);

    console.log("✅ Кошелек подключен:", selectedAccount);
    await initContracts(web3Provider);
    await showIbitiBalance(true);

  } catch (err) {
    console.error("❌ Ошибка подключения:", err);
    alert("Ошибка подключения кошелька");
  }
}

// -----------------------------
// 6) Инициализация контрактов
// -----------------------------
async function initContracts(web3Provider) {
  const ethSigner = web3Provider.getSigner();

  // Существующие контракты
  window.ibitiToken   = new ethers.Contract(IBITI_TOKEN_ADDRESS,      ibitiTokenAbi,      ethSigner);
  window.saleManager  = new ethers.Contract(NFTSALEMANAGER_ADDRESS,  nftSaleManagerAbi,  ethSigner);
  window.nftDiscount  = new ethers.Contract(NFT_DISCOUNT_ADDRESS,    nftDiscountAbi,     ethSigner);

  // Новый контракт фазовой продажи
  window.saleContract = new ethers.Contract(PHASED_TOKENSALE_ADDRESS, phasedTokenSaleAbi, ethSigner);

  // USDT для approve/cost
  window.USDTToken    = new ethers.Contract(USDT_TOKEN_ADDRESS,      erc20Abi,           ethSigner);

  console.log("✅ Контракты инициализированы:");
  console.log("   IBITI:", IBITI_TOKEN_ADDRESS);
  console.log("   SaleMgr:", NFTSALEMANAGER_ADDRESS);
  console.log("   Discount:", NFT_DISCOUNT_ADDRESS);
  console.log("   PhasedSale:", PHASED_TOKENSALE_ADDRESS);
  console.log("   USDT:", USDT_TOKEN_ADDRESS);
}

// -----------------------------
// 7) Показ баланса IBITI
// -----------------------------
async function showIbitiBalance(highlight = false) {
  if (!window.ibitiToken || !selectedAccount) return;
  try {
    const bal = await window.ibitiToken.balanceOf(selectedAccount);
    const fmt = ethers.utils.formatUnits(bal, 8);
    const el  = document.getElementById("ibitiBalance");
    el.innerText = `Ваш баланс IBITI: ${fmt}`;
    if (highlight) {
      el.style.transition = "background 0.3s";
      el.style.background   = "rgba(255,215,0,0.2)";
      setTimeout(() => el.style.background = "transparent", 500);
    }
  } catch (e) {
    console.error("Ошибка баланса:", e);
  }
}

// -----------------------------
// 8) Отключение кошелька
// -----------------------------
async function disconnectWallet() {
  if (provider?.close) await provider.close();
  provider = null; signer = null; selectedAccount = null;
  document.getElementById("walletAddress").innerText = "Wallet disconnected";
  document.getElementById("ibitiBalance").innerText = "";
  console.log("🔌 Кошелек отключен");
}

// -----------------------------
// 9) Обработчик кнопки
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("connectWalletBtn");
  if (btn) btn.addEventListener("click", e => { e.preventDefault(); connectWallet(); });
});

// -----------------------------
// 10) Экспорт
// -----------------------------
export { connectWallet, disconnectWallet, provider };

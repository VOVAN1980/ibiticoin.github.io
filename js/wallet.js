// js/wallet.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";
import { initSaleContract }   from "./sale.js";
import config                 from "./config.js";

console.log("✅ wallet.js загружен");

export let selectedAccount = null;
export let signer = null;
export let provider = null;

const ZERO = "0x0000000000000000000000000000000000000000";

function safeGetAddress(addr) {
  try {
    const a = ethers.getAddress(addr);
    if (a === ethers.ZeroAddress) return null;
    return a;
  } catch {
    return null;
  }
}

const IBITI_TOKEN_ADDRESS      = safeGetAddress(config.active?.contracts?.IBITI_TOKEN);
const NFTSALEMANAGER_ADDRESS   = safeGetAddress(config.active?.contracts?.NFTSALEMANAGER_ADDRESS_MAINNET) || null;
const NFT_DISCOUNT_ADDRESS     = safeGetAddress(config.active?.contracts?.NFTDISCOUNT_ADDRESS_MAINNET) || null;
const PHASED_TOKENSALE_ADDRESS = safeGetAddress(config.active?.contracts?.PHASED_TOKENSALE) || null;

export async function connectWallet() {
  console.log("► connectWallet() вызван");
  try {
    if (!window.ethereum) {
      alert("Injected-провайдер (MetaMask/Trust Wallet) не найден.");
      return;
    }

    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    const req = accounts.length ? accounts : await window.ethereum.request({ method: "eth_requestAccounts" });
    const account = req[0];

    selectedAccount = account;
    window.selectedAccount = selectedAccount;
    console.log("✓ Выбран аккаунт:", selectedAccount);

    const addrEl = document.getElementById("walletAddress");
    if (addrEl) addrEl.innerText = selectedAccount;

    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    signer = await web3Provider.getSigner();
    provider = web3Provider;
    window.signer = signer;

    console.log("✓ ethers провайдер и signer готовы");

    await initContracts();
    await initSaleContract();      // ✅ теперь export реально есть
    await showIbitiBalance(true);

    window.ethereum.on("accountsChanged", async (newAccounts) => {
      if (!newAccounts.length) return disconnectWallet();
      selectedAccount = newAccounts[0];
      window.selectedAccount = selectedAccount;
      const addrEl2 = document.getElementById("walletAddress");
      if (addrEl2) addrEl2.innerText = selectedAccount;
      await showIbitiBalance(true);
      if (typeof window.loadSaleStats === "function") window.loadSaleStats();
    });

    window.ethereum.on("disconnect", () => disconnectWallet());

  } catch (e) {
    console.error("✖ Ошибка в connectWallet():", e);
    alert("Не удалось подключиться к кошельку.");
  }
}
window.connectWallet = connectWallet;

export async function connectViaCoinbase() {
  console.log("► connectViaCoinbase() вызван");
  try {
    const CoinbaseWalletSDK = window.CoinbaseWalletSDK;
    if (!CoinbaseWalletSDK) {
      alert("CoinbaseWalletSDK не найден. Проверь UMD-скрипт.");
      return;
    }

    const walletLink = new CoinbaseWalletSDK({ appName: "IBITIcoin DApp", darkMode: false });
    const coinbaseProvider = walletLink.makeWeb3Provider("https://bsc-dataseed.binance.org/", 56);

    const accounts = await coinbaseProvider.request({ method: "eth_requestAccounts" });
    selectedAccount = accounts[0];
    window.selectedAccount = selectedAccount;

    const addrEl = document.getElementById("walletAddress");
    if (addrEl) addrEl.innerText = selectedAccount;

    const web3Provider = new ethers.BrowserProvider(coinbaseProvider);
    signer = await web3Provider.getSigner();
    provider = web3Provider;
    window.signer = signer;

    await initContracts();
    await initSaleContract();
    await showIbitiBalance(true);

    coinbaseProvider.on("accountsChanged", async (newAccounts) => {
      if (!newAccounts.length) return disconnectWallet();
      selectedAccount = newAccounts[0];
      window.selectedAccount = selectedAccount;
      const addrEl2 = document.getElementById("walletAddress");
      if (addrEl2) addrEl2.innerText = selectedAccount;
      await showIbitiBalance(true);
      if (typeof window.loadSaleStats === "function") window.loadSaleStats();
    });

    coinbaseProvider.on("disconnect", () => disconnectWallet());

  } catch (e) {
    console.error("✖ Ошибка в connectViaCoinbase():", e);
    alert("Не удалось подключиться через Coinbase Wallet.");
  }
}
window.connectViaCoinbase = connectViaCoinbase;

export async function initContracts() {
  console.log("► initContracts()");
  try {
    window.ibitiToken = IBITI_TOKEN_ADDRESS
      ? new ethers.Contract(IBITI_TOKEN_ADDRESS, ibitiTokenAbi, signer)
      : null;

    window.saleManager = NFTSALEMANAGER_ADDRESS
      ? new ethers.Contract(NFTSALEMANAGER_ADDRESS, nftSaleManagerAbi, signer)
      : null;

    window.nftDiscount = NFT_DISCOUNT_ADDRESS
      ? new ethers.Contract(NFT_DISCOUNT_ADDRESS, nftDiscountAbi, signer)
      : null;

    window.phasedSale = PHASED_TOKENSALE_ADDRESS
      ? new ethers.Contract(PHASED_TOKENSALE_ADDRESS, PhasedTokenSaleAbi, signer)
      : null;

    console.log("✓ Контракты:", {
      ibitiToken: IBITI_TOKEN_ADDRESS || ZERO,
      saleManager: NFTSALEMANAGER_ADDRESS || ZERO,
      nftDiscount: NFT_DISCOUNT_ADDRESS || ZERO,
      phasedSale: PHASED_TOKENSALE_ADDRESS || ZERO,
    });

  } catch (e) {
    console.error("✖ Ошибка в initContracts():", e);
  }
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
        el.style.transition = "background 0.3s";
        el.style.background = "rgba(255,215,0,0.2)";
        setTimeout(() => (el.style.background = "transparent"), 500);
      }
    }
  } catch (e) {
    console.error("✖ Ошибка в showIbitiBalance():", e);
  }
}

export async function disconnectWallet() {
  console.log("► disconnectWallet()");
  provider = null;
  signer = null;
  selectedAccount = null;

  const addrEl = document.getElementById("walletAddress");
  if (addrEl) addrEl.innerText = "Disconnected";

  const balEl = document.getElementById("ibitiBalance");
  if (balEl) balEl.innerText = "";
}

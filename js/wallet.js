import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";

let provider = null;
let signer = null;
let selectedAccount = null;

const IBITI_TOKEN_ADDRESS      = "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196";
const NFTSALEMANAGER_ADDRESS   = "0x5572F3AE84319Fbd6e285a0CB854f92Afd31dd6D";
const NFT_DISCOUNT_ADDRESS     = "0x26C4E3D3E40943D2d569e832A243e329E14ecb02";
const PHASED_TOKENSALE_ADDRESS = "0x3092cFDfF6890F33b3227c3d2740F84772A465c7";

export async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Injected-провайдер (MetaMask/Trust Wallet) не найден.");
      return;
    }
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    let account;
    if (accounts.length === 0) {
      const requested = await window.ethereum.request({ method: "eth_requestAccounts" });
      account = requested[0];
    } else {
      account = accounts[0];
    }
    selectedAccount = account;
    window.selectedAccount = selectedAccount;

    const addrEl = document.getElementById("walletAddress");
    if (addrEl) addrEl.innerText = selectedAccount;

    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    signer = await web3Provider.getSigner();
    provider = web3Provider;

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
      }
    }

    console.log("✅ Подключено через injected-провайдер:", selectedAccount);
    await initContracts();
    await showIbitiBalance(true);

    window.ethereum.on("accountsChanged", async (newAccounts) => {
      if (!newAccounts.length) {
        disconnectWallet();
        return;
      }
      selectedAccount = newAccounts[0];
      window.selectedAccount = selectedAccount;
      const wEl = document.getElementById("walletAddress");
      if (wEl) wEl.innerText = selectedAccount;
      await showIbitiBalance(true);
    });
    window.ethereum.on("disconnect", () => {
      disconnectWallet();
    });
  } catch (err) {
    console.error("Ошибка connectWallet():", err);
    alert("Не удалось подключиться к кошельку.");
  }
}
window.connectWallet = connectWallet;

export async function connectViaCoinbase() {
  try {
    const walletLink = new CoinbaseWalletSDK({
      appName: "IBITIcoin DApp",
      darkMode: false
    });
    const coinbaseProvider = walletLink.makeWeb3Provider("https://bsc-dataseed.binance.org/", 56);

    const accounts = await coinbaseProvider.request({ method: "eth_requestAccounts" });
    const account = accounts[0];
    selectedAccount = account;
    window.selectedAccount = selectedAccount;

    const addrEl = document.getElementById("walletAddress");
    if (addrEl) addrEl.innerText = selectedAccount;

    const web3Provider = new ethers.BrowserProvider(coinbaseProvider);
    signer = await web3Provider.getSigner();
    provider = web3Provider;

    console.log("✅ Подключено через Coinbase Wallet:", selectedAccount);
    await initContracts();
    await showIbitiBalance(true);

    coinbaseProvider.on("accountsChanged", async (newAccounts) => {
      if (!newAccounts.length) {
        disconnectWallet();
        return;
      }
      selectedAccount = newAccounts[0];
      window.selectedAccount = selectedAccount;
      const wEl = document.getElementById("walletAddress");
      if (wEl) wEl.innerText = selectedAccount;
      await showIbitiBalance(true);
    });
    coinbaseProvider.on("disconnect", () => {
      disconnectWallet();
    });
  } catch (err) {
    console.error("Ошибка connectViaCoinbase():", err);
    alert("Не удалось подключиться через Coinbase Wallet.");
  }
}
window.connectViaCoinbase = connectViaCoinbase;

export async function initContracts() {
  window.ibitiToken  = new ethers.Contract(IBITI_TOKEN_ADDRESS,      ibitiTokenAbi,      signer);
  window.saleManager = new ethers.Contract(NFTSALEMANAGER_ADDRESS,   nftSaleManagerAbi,  signer);
  window.nftDiscount = new ethers.Contract(NFT_DISCOUNT_ADDRESS,     nftDiscountAbi,     signer);
  window.phasedSale  = new ethers.Contract(PHASED_TOKENSALE_ADDRESS, PhasedTokenSaleAbi, signer);
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
    console.error("Ошибка showIbitiBalance():", err);
  }
}

export async function disconnectWallet() {
  if (provider?.provider?.disconnect) {
    await provider.provider.disconnect();
  }
  provider = null;
  signer = null;
  selectedAccount = null;
  const wEl = document.getElementById("walletAddress");
  if (wEl) wEl.innerText = "Disconnected";
  const bEl = document.getElementById("ibitiBalance");
  if (bEl) bEl.innerText = "";
  console.log("🔌 Кошелек отключен");
}

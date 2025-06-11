// js/wallet.js

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
// ABI-файлы (если они у вас лежат в папке ./abis)
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

const IBITI_TOKEN_ADDRESS      = config.active.contracts.IBITI_TOKEN;
const NFTSALEMANAGER_ADDRESS   = config.active.contracts.NFTSALEMANAGER_ADDRESS_MAINNET ?? "0x0";
const NFT_DISCOUNT_ADDRESS     = config.active.contracts.NFTDISCOUNT_ADDRESS_MAINNET   ?? "0x0";
const PHASED_TOKENSALE_ADDRESS = config.active.contracts.PHASED_TOKENSALE;

export async function connectWallet() {
  console.log("► connectWallet() вызван");
  try {
    if (!window.ethereum) {
      alert("Injected-провайдер (MetaMask/Trust Wallet) не найден.");
      return;
    }

    // Если уже был запрошен доступ, вернётся массив; иначе – запросим новый доступ
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    let account;
    if (accounts.length === 0) {
      const req = await window.ethereum.request({ method: "eth_requestAccounts" });
      account = req[0];
    } else {
      account = accounts[0];
    }

    selectedAccount = account;
    window.selectedAccount = selectedAccount;
    console.log("✓ Выбран аккаунт:", selectedAccount);

    // Покажем его в DOM (если элемент есть)
    const addrEl = document.getElementById("walletAddress");
    if (addrEl) {
      addrEl.innerText = selectedAccount;
    }

    // Создаём провайдер Ethers и получаем signer
    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    signer = await web3Provider.getSigner();
    provider = web3Provider;
    window.signer = signer;
    console.log("✓ ethers провайдер и signer готовы");

    // Переключаем цепочку на BSC (если нужно)
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
      console.log("✓ Цепочка переключена на BSC Mainnet");
    } catch (switchError) {
      // Если в MetaMask нет BSC, добавляем её
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x38",
              chainName: "Binance Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: ["https://bsc-dataseed.binance.org/"],
              blockExplorerUrls: ["https://bscscan.com"],
            },
          ],
        });
        console.log("✓ Цепочка BSC добавлена в MetaMask");
      }
    }

    // Теперь инициализируем контракты (IBITI, SaleManager, NFT-discount и PhasedSale)
    await initContracts();
    console.log("✓ Контракты инициализированы в window");
    await initSaleContract();
    console.log("✓ saleContract инициализирован в sale.js");
    await showIbitiBalance(true);

    // Подпишемся на смену аккаунтов / дисконнект
    window.ethereum.on("accountsChanged", async (newAccounts) => {
      if (!newAccounts.length) {
        disconnectWallet();
        return;
      }
      selectedAccount = newAccounts[0];
      window.selectedAccount = selectedAccount;
      console.log("► accountsChanged → now:", selectedAccount);
      const addrEl2 = document.getElementById("walletAddress");
      if (addrEl2) addrEl2.innerText = selectedAccount;
      await showIbitiBalance(true);
    });

    window.ethereum.on("disconnect", () => {
      console.log("► Авторизованный провайдер дисконнектнулся");
      disconnectWallet();
    });
  } catch (e) {
    console.error("✖ Ошибка в connectWallet():", e);
    alert("Не удалось подключиться к кошельку.");
  }
}
window.connectWallet = connectWallet;

export async function connectViaCoinbase() {
  console.log("► connectViaCoinbase() вызван");
  try {
    // Берём глобальный объект из UMD-скрипта
    const CoinbaseWalletSDK = window.CoinbaseWalletSDK;
    if (!CoinbaseWalletSDK) {
      alert("CoinbaseWalletSDK не найден. Проверьте, верно ли подключён UMD-скрипт.");
      return;
    }

    const walletLink = new CoinbaseWalletSDK({
      appName: "IBITIcoin DApp",
      darkMode: false,
    });
    const coinbaseProvider = walletLink.makeWeb3Provider(
      "https://bsc-dataseed.binance.org/",
      56
    );

    // Запрашиваем аккаунты
    const accounts = await coinbaseProvider.request({ method: "eth_requestAccounts" });
    const account = accounts[0];
    selectedAccount = account;
    window.selectedAccount = selectedAccount;
    console.log("✓ Coinbase выбрал аккаунт:", selectedAccount);

    // Обновляем адрес в DOM
    const addrEl = document.getElementById("walletAddress");
    if (addrEl) addrEl.innerText = selectedAccount;

    // Создаём ethers-провайдер на основе coinbaseProvider
    const web3Provider = new ethers.BrowserProvider(coinbaseProvider);
    signer = await web3Provider.getSigner();
    provider = web3Provider;
    window.signer = signer;
    console.log("✓ ethers провайдер и signer (Coinbase) готовы");

    await initContracts();
    console.log("✓ Контракты инициализированы (Coinbase)");
    await initSaleContract();
    console.log("✓ saleContract инициализирован (Coinbase)");
    await showIbitiBalance(true);

    // Подписываемся на изменения аккаунтов в Coinbase-провайдере
    coinbaseProvider.on("accountsChanged", async (newAccounts) => {
      if (!newAccounts.length) {
        disconnectWallet();
        return;
      }
      selectedAccount = newAccounts[0];
      window.selectedAccount = selectedAccount;
      console.log("► (Coinbase) accountsChanged → now:", selectedAccount);
      const addrEl2 = document.getElementById("walletAddress");
      if (addrEl2) addrEl2.innerText = selectedAccount;
      await showIbitiBalance(true);
    });

    coinbaseProvider.on("disconnect", () => {
      console.log("► (Coinbase) провайдер дисконнектнулся");
      disconnectWallet();
    });
  } catch (e) {
    console.error("✖ Ошибка в connectViaCoinbase():", e);
    alert("Не удалось подключиться через Coinbase Wallet.");
  }
}
window.connectViaCoinbase = connectViaCoinbase;


export async function initContracts() {
  console.log("► initContracts() → создаём контрактные объекты");
  try {
    window.ibitiToken = new ethers.Contract(
  IBITI_TOKEN_ADDRESS,
  ibitiTokenAbi, // Всегда используем кастомный ABI, потому что контракт нестандартный
  signer
);
    window.saleManager = new ethers.Contract(
      NFTSALEMANAGER_ADDRESS, nftSaleManagerAbi, signer
    );
    window.nftDiscount = new ethers.Contract(
      NFT_DISCOUNT_ADDRESS, nftDiscountAbi, signer
    );
    window.phasedSale  = new ethers.Contract(
      PHASED_TOKENSALE_ADDRESS, PhasedTokenSaleAbi, signer
    );
    console.log("✓ Все контракты установлены в window");
  } catch (e) {
    console.error("✖ Ошибка в initContracts():", e);
  }
}

export async function showIbitiBalance(highlight = false) {
  if (!window.ibitiToken || !selectedAccount) {
    return;
  }
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
  console.log("► disconnectWallet() → очищаем провайдер, signer, selectedAccount");
  if (provider?.provider?.disconnect) {
    try {
      await provider.provider.disconnect();
    } catch {}
  }
  provider = null;
  signer = null;
  selectedAccount = null;

  const addrEl = document.getElementById("walletAddress");
  if (addrEl) addrEl.innerText = "Disconnected";

  const balEl = document.getElementById("ibitiBalance");
    if (balEl) balEl.innerText = "";
}

if (typeof window.loadSaleStats === 'function') {
  window.loadSaleStats();
}

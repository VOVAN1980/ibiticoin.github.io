// js/wallet.js (FIXED)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import { ibitiTokenAbi }      from "./abis/ibitiTokenAbi.js";
import { nftSaleManagerAbi }  from "./abis/nftSaleManagerAbi.js";
import { nftDiscountAbi }     from "./abis/nftDiscountAbi.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";
import { initSaleContract }   from "./sale.js";
import config                 from "./config.js";

console.log("✅ wallet.js loaded (fixed)");

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

async function getActiveConfig() {
  const active = await config.getActive();
  config.active = active; // ✅ важно: другим модулям удобно читать config.active
  return active;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

export async function connectWallet() {
  console.log("► connectWallet()");

  try {
    if (!window.ethereum) {
      alert("Injected-провайдер (MetaMask/Trust Wallet) не найден.");
      return;
    }

    // accounts
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    const req = accounts.length ? accounts : await window.ethereum.request({ method: "eth_requestAccounts" });
    selectedAccount = req[0];
    window.selectedAccount = selectedAccount;

    setText("walletAddress", selectedAccount);

    // provider/signer
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    window.signer = signer;

    // ✅ выбираем сеть/адреса ПОСЛЕ подключения
let active = await getActiveConfig();
console.log("✓ Active network (config):", active.name, "chainId:", active.chainId);

// ✅ проверяем реальную сеть кошелька
let net = await provider.getNetwork();

if (Number(net.chainId) !== Number(active.chainId)) {
  console.warn(`⚠️ Wallet on chainId=${net.chainId}, but page expects ${active.chainId}. Switching...`);

  try {
    await config.switchWalletToActive();
  } catch (e) {
    console.error("✖ switchWalletToActive failed:", e);
    alert(`Переключи сеть в кошельке на ${active.name} (chainId ${active.chainId})`);
    return; // ❗ дальше не идём
  }

  // ⚠️ после смены сети надо пересоздать provider/signer
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  window.signer = signer;

  net = await provider.getNetwork();
  console.log("✓ Wallet switched. Now chainId:", Number(net.chainId));

  // ✅ и ещё раз получить active (на всякий случай, чтобы адреса совпали)
  active = await getActiveConfig();
  console.log("✓ Active network (after switch):", active.name, "chainId:", active.chainId);
}

// ✅ только теперь инициализация контрактов и UI
await initContracts(active);
await initSaleContract();
await showIbitiBalance(true);

    // listeners
    window.ethereum.on("accountsChanged", async (accs) => {
      if (!accs?.length) return disconnectWallet();
      selectedAccount = accs[0];
      window.selectedAccount = selectedAccount;
      setText("walletAddress", selectedAccount);
      const a = await getActiveConfig();
      await initContracts(a);
      await showIbitiBalance(true);
      if (typeof window.loadPromoStats === "function") window.loadPromoStats();
    });

    window.ethereum.on("chainChanged", async () => {
      const a = await getActiveConfig();
      await initContracts(a);
      await showIbitiBalance(true);
      if (typeof window.loadPromoStats === "function") window.loadPromoStats();
    });

    window.ethereum.on("disconnect", () => disconnectWallet());

  } catch (e) {
    console.error("✖ connectWallet error:", e);
    alert("Не удалось подключиться к кошельку.");
  }
}
window.connectWallet = connectWallet;

export async function initContracts(active) {
  console.log("► initContracts()");

  try {
    const IBITI_TOKEN_ADDRESS = safeGetAddress(active?.contracts?.IBITI_TOKEN);
    const NFTSALEMANAGER_ADDRESS = safeGetAddress(active?.contracts?.NFTSALEMANAGER_ADDRESS_MAINNET) || null;
    const NFT_DISCOUNT_ADDRESS = safeGetAddress(active?.contracts?.NFTDISCOUNT_ADDRESS_MAINNET) || null;
    const PHASED_TOKENSALE_ADDRESS = safeGetAddress(active?.contracts?.PHASED_TOKENSALE) || null;

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

    console.log("✓ Contracts:", {
      ibitiToken: IBITI_TOKEN_ADDRESS || ZERO,
      saleManager: NFTSALEMANAGER_ADDRESS || ZERO,
      nftDiscount: NFT_DISCOUNT_ADDRESS || ZERO,
      phasedSale: PHASED_TOKENSALE_ADDRESS || ZERO,
    });

  } catch (e) {
    console.error("✖ initContracts error:", e);
  }
}

export async function showIbitiBalance(highlight = false) {
  if (!window.ibitiToken || !selectedAccount) return;

  try {
    // IBITI decimals = 8, но читаем через abi если есть decimals()
    let dec = 8;
    try {
      if (window.ibitiToken.decimals) dec = Number(await window.ibitiToken.decimals());
    } catch {}

    const balance = await window.ibitiToken.balanceOf(selectedAccount);
    const formatted = ethers.formatUnits(balance, dec);

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
    console.error("✖ showIbitiBalance error:", e);
  }
}

export async function disconnectWallet() {
  console.log("► disconnectWallet()");
  provider = null;
  signer = null;
  selectedAccount = null;

  setText("walletAddress", "Disconnected");
  setText("ibitiBalance", "");
}



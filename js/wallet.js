// js/wallet.js (CLEAN, TESTNET SAFE)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
// something import config from "./config.js";
// something import { initSaleContract } from "./sale.js";

console.log("✅ wallet.js loaded (clean)");

export let selectedAccount = null;
export let provider = null;
export let signer = null;

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

function $(id) { return document.getElementById(id); }

function safeAddr(a) {
  try { return ethers.getAddress(a); } catch { return null; }
}

function setText(id, t) {
  const el = $(id);
  if (el) el.textContent = t;
}

async function showIbitiBalance(active) {
  try {
    const token = safeAddr(active.contracts.IBITI_TOKEN);
    if (!token || !selectedAccount || !signer) return;

    const c = new ethers.Contract(token, ERC20_ABI, signer);
    let dec = 8;
    try { dec = Number(await c.decimals()); } catch {}
    const bal = await c.balanceOf(selectedAccount);
    const txt = ethers.formatUnits(bal, dec);

    setText("ibitiBalance", `Ваш баланс IBITI: ${txt}`);
  } catch (e) {
    console.warn("showIbitiBalance:", e);
  }
}

async function initAfterConnect() {
  const active = await config.getActive();
  config.active = active; // важно для других модулей

  // ✅ заставляем кошелёк быть на активной сети (тестнет)
  await config.ensureWalletOnActive();

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  window.signer = signer;

  selectedAccount = await signer.getAddress();
  window.selectedAccount = selectedAccount;

  setText("walletAddress", selectedAccount);

  console.log(`✅ Active network (config): ${active.name} chainId: ${active.chainId}`);

  await showIbitiBalance(active);

  // init sale stats + referral UI
  await initSaleContract();
  if (typeof window.loadPromoStats === "function") window.loadPromoStats();
}

export async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Кошелёк не найден (MetaMask/Trust).");
      return;
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    await initAfterConnect();

    // events
    window.ethereum.on("accountsChanged", async (accs) => {
      if (!accs?.length) return;
      await initAfterConnect();
    });

    window.ethereum.on("chainChanged", async () => {
      await initAfterConnect();
    });

  } catch (e) {
    console.error("connectWallet:", e);
    alert(e?.message || "Ошибка подключения кошелька");
  }
}

window.connectWallet = connectWallet;


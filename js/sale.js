// js/sale.js (FULL REWRITE)
// Purpose:
// 1) Show promo pool stats from IBITIReferralPromoRouter (new version)
// 2) Show referral link ONLY after first promo purchase >= minPaymentAmount (10 USDT)
//    Eligibility is checked on-chain via PromoBuy event (NOT by IBITI balance).

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";

console.log("✅ sale.js loaded (rewritten)");

// wallet.js expects these exports
export function getSaleContract() {
  return null; // legacy phased sale not used anymore
}

export async function initSaleContract() {
  // called by wallet.js after connect
  try {
    await ensureActiveConfig();
    window.loadSaleStats = loadPromoStats; // backward compat
    window.loadPromoStats = loadPromoStats;

    await loadPromoStats();

    const acc = window.selectedAccount;
    if (acc) await updateReferralUI(acc);
  } catch (e) {
    console.warn("initSaleContract warn:", e);
  }
  return true;
}

// ----------------------
// Constants / ABIs
// ----------------------

const IBITI_DECIMALS = 8;
const USDT_DECIMALS_DEFAULT = 18;

// New PromoRouter (your current testnet deploy)
const PROMO_ROUTER_ABI = [
  "function promoActive() view returns (bool)",
  "function promoEndTime() view returns (uint256)",
  "function bonusBps() view returns (uint256)",
  "function refReward() view returns (uint256)",
  "function minPaymentAmount() view returns (uint256)",
  "function bonusPoolTotal() view returns (uint256)",
  "function bonusSpent() view returns (uint256)",
  "function refSpent() view returns (uint256)",
  "function poolRemaining() view returns (uint256)",
  "function getStats() view returns (uint256 poolTotal,uint256 bonusSpent_,uint256 refSpent_,uint256 remaining)"
];

// Event for eligibility check (indexed buyer)
const PROMO_BUY_EVENT_ABI = [
  "event PromoBuy(address indexed buyer,address indexed referrer,uint256 paymentAmount,uint256 boughtAmount,uint256 bonusAmount,uint256 refAmount)"
];

const ERC20_ABI = [
  "function decimals() view returns (uint8)"
];

// ----------------------
// Helpers
// ----------------------

const $ = (id) => document.getElementById(id);

function fmtIBITI(x) {
  try { return ethers.formatUnits(x, IBITI_DECIMALS); } catch { return "0"; }
}

function fmtUSDT(x, dec = USDT_DECIMALS_DEFAULT) {
  try { return ethers.formatUnits(x, dec); } catch { return "0"; }
}

function nowStamp() {
  return new Date().toLocaleString();
}

function safeGetAddress(addr) {
  try {
    const a = ethers.getAddress(addr);
    if (a === ethers.ZeroAddress) return null;
    return a;
  } catch {
    return null;
  }
}

async function hasCode(provider, addr) {
  try {
    const code = await provider.getCode(addr);
    return code && code !== "0x";
  } catch {
    return false;
  }
}

// Make sure config.active exists for other modules, but also support config.getActive()
async function ensureActiveConfig() {
  if (config?.getActive && typeof config.getActive === "function") {
    const active = await config.getActive();
    // keep compatibility for old code that reads config.active
    config.active = active;
    return active;
  }
  // fallback: older config.js style
  if (config?.active) return config.active;

  // if nothing exists — don't crash
  return null;
}

async function getReadProvider(active) {
  // Prefer wallet provider (because user is actually connected to the right chain)
  if (window.ethereum) return new ethers.BrowserProvider(window.ethereum);

  // If your config has rpcUrl - use it, else return null
  const rpcUrl = active?.rpcUrl;
  if (rpcUrl) return new ethers.JsonRpcProvider(rpcUrl);

  return null;
}

function storageKey(active, account, routerAddr) {
  const cid = active?.chainId ?? "x";
  return `ibiti_ref_ok_${cid}_${(routerAddr || "").toLowerCase()}_${account.toLowerCase()}`;
}

// ----------------------
// STATS UI
// ----------------------

async function setStatsEmpty() {
  const ids = ["cap", "refReserve", "salePool", "sold", "left", "bonusPool", "soldPercent", "lastUpdated"];
  ids.forEach((id) => { if ($(id)) $(id).textContent = "—"; });
  if ($("salesProgress")) $("salesProgress").style.width = "0%";
}

export async function loadPromoStats() {
  try {
    const active = await ensureActiveConfig();
    if (!active) {
      await setStatsEmpty();
      console.warn("⛔ config.active is missing");
      return;
    }

    const routerAddr = active?.contracts?.REFERRAL_SWAP_ROUTER;
    const routerOk = safeGetAddress(routerAddr);

    if (!routerOk) {
      await setStatsEmpty();
      console.warn("⛔ Promo router address missing/invalid:", { routerAddr });
      return;
    }

    const provider = await getReadProvider(active);
    if (!provider) {
      await setStatsEmpty();
      console.warn("⛔ No provider (wallet not found and no rpcUrl in config).");
      return;
    }

    if (!(await hasCode(provider, routerOk))) {
      await setStatsEmpty();
      console.warn("⛔ REFERRAL_SWAP_ROUTER: no contract code at address (wrong network?):", routerOk);
      return;
    }

    const promo = new ethers.Contract(routerOk, PROMO_ROUTER_ABI, provider);

    // read core params + stats
    const [
      promoActive,
      endTime,
      bonusBps,
      minPay,
      refReward,
      stats
    ] = await Promise.all([
      promo.promoActive().catch(() => false),
      promo.promoEndTime().catch(() => 0n),
      promo.bonusBps().catch(() => 0n),
      promo.minPaymentAmount().catch(() => 0n),
      promo.refReward().catch(() => 0n),
      promo.getStats().catch(() => [0n, 0n, 0n, 0n])
    ]);

    const poolTotal  = BigInt(stats[0]);
    const bonusSpent = BigInt(stats[1]);
    const refSpent   = BigInt(stats[2]);
    const remaining  = BigInt(stats[3]);

    const sold = bonusSpent + refSpent;
    const soldPct = poolTotal > 0n ? Number((sold * 10000n) / poolTotal) / 100 : 0;

    // Map to your current UI labels (this is pool stats: bonus + referrals)
    if ($("cap"))      $("cap").textContent      = fmtIBITI(poolTotal);
    if ($("salePool")) $("salePool").textContent = fmtIBITI(poolTotal);
    if ($("sold"))     $("sold").textContent     = fmtIBITI(sold);
    if ($("left"))     $("left").textContent     = fmtIBITI(remaining);

    if ($("bonusPool"))  $("bonusPool").textContent  = fmtIBITI(bonusSpent);
    if ($("refReserve")) $("refReserve").textContent = fmtIBITI(refSpent);

    if ($("soldPercent")) $("soldPercent").textContent = `${soldPct.toFixed(2)}%`;
    if ($("salesProgress")) $("salesProgress").style.width = `${Math.min(100, Math.max(0, soldPct))}%`;

    if ($("lastUpdated")) {
      const bonusPct = (Number(bonusBps) / 100).toFixed(2);
      const endTxt = (BigInt(endTime) === 0n) ? "∞" : new Date(Number(endTime) * 1000).toLocaleString();
      $("lastUpdated").textContent =
        `Updated: ${nowStamp()} | net=${active.name ?? active.chainId} | promo=${promoActive} | bonus=${bonusPct}% | minUSDT=${fmtUSDT(minPay)} | ref=${fmtIBITI(refReward)} | end=${endTxt}`;
    }

    // Debug
    console.log("📊 PromoPoolStats:", {
      chainId: active.chainId,
      router: routerOk,
      poolTotal: String(poolTotal),
      bonusSpent: String(bonusSpent),
      refSpent: String(refSpent),
      remaining: String(remaining),
    });

  } catch (e) {
    console.error("✖ loadPromoStats error:", e);
    await setStatsEmpty();
  }
}

// ----------------------
// REFERRAL LINK: ONLY AFTER BUY >= 10 USDT (on-chain event)
// ----------------------

async function lockReferralUI() {
  const linkInput = $("myReferralLink");
  if (linkInput) {
    linkInput.value = ""; // IMPORTANT: no link before eligibility
  }
  // buttons are managed by your inline script:
  // before eligible it shows SweetAlert "Not available"
}

async function buyerHasPromoPurchase(active, routerAddr, buyer) {
  const provider = await getReadProvider(active);
  if (!provider) return false;

  const routerOk = safeGetAddress(routerAddr);
  if (!routerOk) return false;
  if (!(await hasCode(provider, routerOk))) return false;

  const promo = new ethers.Contract(routerOk, PROMO_ROUTER_ABI, provider);
  const minPay = await promo.minPaymentAmount().catch(() => 0n);

  // Event filter
  const iface = new ethers.Interface(PROMO_BUY_EVENT_ABI);
  const topic0 = iface.getEvent("PromoBuy").topicHash;

  const buyerTopic = ethers.zeroPadValue(ethers.getAddress(buyer), 32);

  // If you add promoDeployBlock to config later - use it. Otherwise from 0.
  const fromBlock = active?.promoDeployBlock ?? 0;

  let logs = [];
  try {
    logs = await provider.getLogs({
      address: routerOk,
      fromBlock,
      toBlock: "latest",
      topics: [topic0, buyerTopic]
    });
  } catch (e) {
    console.warn("getLogs failed:", e);
    return false;
  }

  for (const log of logs) {
    try {
      const parsed = iface.parseLog(log);
      const paymentAmount = BigInt(parsed.args.paymentAmount);
      if (paymentAmount >= BigInt(minPay)) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

async function updateReferralUI(account) {
  const active = await ensureActiveConfig();
  if (!active) {
    await lockReferralUI();
    return;
  }

  const routerAddr = active?.contracts?.REFERRAL_SWAP_ROUTER;
  const routerOk = safeGetAddress(routerAddr);
  if (!routerOk) {
    await lockReferralUI();
    return;
  }

  // Always locked first (no “free link on connect”)
  await lockReferralUI();

  // 1) fast cache
  const key = storageKey(active, account, routerOk);
  if (localStorage.getItem(key) === "1") {
    if (typeof window.enableReferralAfterPurchase === "function") {
      window.enableReferralAfterPurchase(account);
    }
    return;
  }

  // 2) on-chain proof via PromoBuy event
  const ok = await buyerHasPromoPurchase(active, routerOk, account);
  if (ok) {
    localStorage.setItem(key, "1");
    if (typeof window.enableReferralAfterPurchase === "function") {
      window.enableReferralAfterPurchase(account);
    }
  }
}

// ----------------------
// Wallet events / init
// ----------------------

function hookWalletEvents() {
  if (!window.ethereum?.on) return;

  window.ethereum.on("accountsChanged", async (accs) => {
    const a = accs?.[0];
    if (!a) {
      await lockReferralUI();
      return;
    }
    window.selectedAccount = a;
    await ensureActiveConfig();
    await loadPromoStats();
    await updateReferralUI(a);
  });

  window.ethereum.on("chainChanged", async () => {
    await ensureActiveConfig();
    await loadPromoStats();
    const a = window.selectedAccount;
    if (a) await updateReferralUI(a);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await ensureActiveConfig();

  window.loadSaleStats = loadPromoStats;
  window.loadPromoStats = loadPromoStats;

  await loadPromoStats();

  const refreshBtn = $("refreshStats") || $("refreshButton") || $("refresh");
  if (refreshBtn) refreshBtn.addEventListener("click", loadPromoStats);

  // On load: lock link (no link on connect)
  await lockReferralUI();

  // If wallet already connected
  const account = window.selectedAccount;
  if (account) await updateReferralUI(account);

  hookWalletEvents();

  // refresh every 30s
  setInterval(loadPromoStats, 30000);
});

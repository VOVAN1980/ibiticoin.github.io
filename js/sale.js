// js/sale.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";

console.log("✅ sale.js загружен");

export function getSaleContract() {
  return null; // phasedSale тут больше не используется
}

// ✅ ЭТО НУЖНО, потому что wallet.js делает import { initSaleContract } from "./sale.js"
export async function initSaleContract() {
  // просто обновим UI/статы после коннекта кошелька
  try {
    window.loadSaleStats = loadPromoStats; // совместимость со старым именем
    window.loadPromoStats = loadPromoStats;
    await loadPromoStats();

    const acc = window.selectedAccount;
    if (acc) await updateReferralUI(acc);
  } catch (e) {
    console.warn("initSaleContract warn:", e);
  }
  return true;
}

const IBITI_DECIMALS = 8;
const QUALIFY_IBITI_MIN = 10n * 10n ** 8n; // 10 IBITI (8 decimals)

// --- ABIs ---
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const PROMO_ROUTER_ABI = [
  "function promoActive() view returns (bool)",
  "function bonusPercent() view returns (uint256)",
  "function minUsdtAmount() view returns (uint256)",
  "function referrerRewardIBITI() view returns (uint256)",
  "function getPromoStats() view returns (uint256 buys,uint256 usdtIn,uint256 ibitiToBuyers,uint256 bonusPaid,uint256 refPaid,uint256 ibitiOnContract,uint256 ibitiWithdrawn,uint256 usdtWithdrawn)",
];

// --- helpers ---
const $ = (id) => document.getElementById(id);
const fmt8 = (x) => ethers.formatUnits(x, IBITI_DECIMALS);
const nowStamp = () => new Date().toLocaleString();

function safeGetAddress(addr) {
  try {
    const a = ethers.getAddress(addr);
    if (a === ethers.ZeroAddress) return null; // ✅ запрет нулевого адреса
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

function buildRefLink(account) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?ref=${account}`;
}

async function getReadProvider() {
  if (window.ethereum) return new ethers.BrowserProvider(window.ethereum);
  return new ethers.JsonRpcProvider(config.active.rpcUrl);
}

async function getWalletProvider() {
  if (!window.ethereum) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

// --- Promo Stats ---
async function setStatsEmpty() {
  const ids = ["cap", "refReserve", "salePool", "sold", "left", "bonusPool", "soldPercent", "lastUpdated"];
  ids.forEach((id) => { if ($(id)) $(id).textContent = "—"; });
  if ($("salesProgress")) $("salesProgress").style.width = "0%";
}

async function loadPromoStats() {
  try {
    const routerAddr = config.active?.contracts?.REFERRAL_SWAP_ROUTER;
    const ibitiAddr  = config.active?.contracts?.IBITI_TOKEN;

    const routerOk = safeGetAddress(routerAddr);
    const ibitiOk  = safeGetAddress(ibitiAddr);

    if (!routerOk || !ibitiOk) {
      await setStatsEmpty();
      console.warn("⛔ Адреса не заданы/невалидны:", { routerAddr, ibitiAddr });
      return;
    }

    const provider = await getReadProvider();

    // ✅ если адрес не контракт или сеть не та — не дергаем ABI вообще
    if (!(await hasCode(provider, routerOk))) {
      await setStatsEmpty();
      console.warn("⛔ REFERRAL_SWAP_ROUTER: по адресу нет кода контракта (или сеть не та):", routerOk);
      return;
    }
    if (!(await hasCode(provider, ibitiOk))) {
      await setStatsEmpty();
      console.warn("⛔ IBITI_TOKEN: по адресу нет кода контракта (или сеть не та):", ibitiOk);
      return;
    }

    const promo = new ethers.Contract(routerOk, PROMO_ROUTER_ABI, provider);
    const ibiti = new ethers.Contract(ibitiOk, ERC20_ABI, provider);

    // (не обязательно) контроль decimals
    try {
      const dec = await ibiti.decimals();
      if (Number(dec) !== IBITI_DECIMALS) console.warn("⚠ IBITI decimals != 8, got:", dec);
    } catch {}

    const [promoActive, bonusPercent, minUsdtAmount, refReward, stats] = await Promise.all([
      promo.promoActive(),
      promo.bonusPercent(),
      promo.minUsdtAmount(),
      promo.referrerRewardIBITI(),
      promo.getPromoStats(),
    ]);

    const buys             = BigInt(stats[0]);
    const usdtIn           = BigInt(stats[1]);
    const ibitiToBuyers    = BigInt(stats[2]); // включает бонус
    const bonusPaid        = BigInt(stats[3]);
    const refPaid          = BigInt(stats[4]);
    const ibitiOnContract  = BigInt(stats[5]);
    const ibitiWithdrawn   = BigInt(stats[6]);

    const cap  = ibitiOnContract + ibitiToBuyers + refPaid + ibitiWithdrawn;
    const sold = ibitiToBuyers + refPaid;
    const left = ibitiOnContract;

    const soldPct = cap > 0n ? Number((sold * 10000n) / cap) / 100 : 0;

    if ($("cap"))        $("cap").textContent        = fmt8(cap);
    if ($("salePool"))   $("salePool").textContent   = fmt8(cap);
    if ($("sold"))       $("sold").textContent       = fmt8(sold);
    if ($("left"))       $("left").textContent       = fmt8(left);

    if ($("refReserve")) $("refReserve").textContent = fmt8(refPaid);
    if ($("bonusPool"))  $("bonusPool").textContent  = fmt8(bonusPaid);

    if ($("soldPercent")) $("soldPercent").textContent = `${soldPct.toFixed(2)}%`;
    if ($("salesProgress")) $("salesProgress").style.width = `${Math.min(100, Math.max(0, soldPct))}%`;

    if ($("lastUpdated")) {
      $("lastUpdated").textContent =
        `Updated: ${nowStamp()} | promoActive=${promoActive} | bonus=${bonusPercent}% | minUSDT=${ethers.formatUnits(minUsdtAmount, 18)} | refReward=${fmt8(refReward)}`;
    }

    console.log("📊 PromoStats:", {
      chainId: config.active?.chainId,
      router: routerOk,
      buys: String(buys),
      usdtIn: String(usdtIn),
      soldIBITI: String(sold),
      leftIBITI: String(left),
    });

  } catch (e) {
    console.error("✖ loadPromoStats error:", e);
    await setStatsEmpty();
  }
}

// --- Referral link gating (>=10 IBITI) ---
async function checkReferralEligibility(account) {
  try {
    const ibitiAddr = safeGetAddress(config.active?.contracts?.IBITI_TOKEN);
    if (!ibitiAddr) return false;

    const p = await getWalletProvider();
    if (!p) return false;

    const ibiti = new ethers.Contract(ibitiAddr, ERC20_ABI, p);
    const bal = BigInt(await ibiti.balanceOf(account));
    return bal >= QUALIFY_IBITI_MIN;
  } catch {
    return false;
  }
}

async function updateReferralUI(account) {
  const linkInput = $("myReferralLink");
  if (!linkInput) return;

  linkInput.value = buildRefLink(account);

  const eligible = await checkReferralEligibility(account);
  if (eligible) {
    if (typeof window.enableReferralAfterPurchase === "function") {
      window.enableReferralAfterPurchase(account);
    }
  }
}

function hookWalletEvents() {
  if (!window.ethereum?.on) return;

  window.ethereum.on("accountsChanged", async (accs) => {
    const a = accs?.[0];
    if (!a) return;
    await updateReferralUI(a);
    await loadPromoStats();
  });

  window.ethereum.on("chainChanged", async () => {
    const a = window.selectedAccount;
    if (a) await updateReferralUI(a);
    await loadPromoStats();
  });
}

// --- init ---
document.addEventListener("DOMContentLoaded", async () => {
  window.loadSaleStats = loadPromoStats; // ✅ чтобы wallet.js мог дергать, если захочет
  window.loadPromoStats = loadPromoStats;

  await loadPromoStats();

  const btn =
    $("refreshStats") ||
    $("refreshButton") ||
    $("refresh") ||
    document.querySelector("[data-action='refreshStats']");
  if (btn) btn.addEventListener("click", loadPromoStats);

  const account = window.selectedAccount;
  if (account) await updateReferralUI(account);

  hookWalletEvents();
  setInterval(loadPromoStats, 30000);
});

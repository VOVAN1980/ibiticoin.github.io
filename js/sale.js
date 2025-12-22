// js/sale.js (PROMO STATS + REF LINK GATE)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
<!--import config from "./config.js";

console.log("✅ sale.js loaded (final)");

const PROMO_ABI = [
  "function promoActive() view returns (bool)",
  "function promoEndTime() view returns (uint256)",
  "function bonusBps() view returns (uint256)",
  "function minPaymentAmount() view returns (uint256)",
  "function bonusPoolTotal() view returns (uint256)",
  "function bonusSpent() view returns (uint256)",
  "function refSpent() view returns (uint256)",
  "function poolRemaining() view returns (uint256)",
  "function getStats() view returns (uint256 poolTotal,uint256 bonusSpent_,uint256 refSpent_,uint256 remaining)"
];

const IBITI_DEC = 8;

function setFirst(ids, value) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) { el.textContent = value; return true; }
  }
  return false;
}

function fmtIBITI(x) {
  try { return ethers.formatUnits(x, IBITI_DEC); } catch { return "0"; }
}

function nowStamp() {
  return new Date().toLocaleString();
}

async function readProvider(active) {
  // если есть кошелёк — читаем с него (на той же сети)
  if (window.ethereum) return new ethers.BrowserProvider(window.ethereum);
  // без кошелька — RPC
  return new ethers.JsonRpcProvider(active.rpcUrl);
}

export async function loadPromoStats() {
  const active = await config.getActive();
  config.active = active;

  const router = active.contracts.REFERRAL_SWAP_ROUTER;
  if (!router) {
    console.warn("⛔ Promo router address empty (network not ready?)");
    return;
  }

  const provider = await readProvider(active);
  const code = await provider.getCode(router);
  if (!code || code === "0x") {
    console.warn("⛔ No contract code at promo router:", router);
    return;
  }

  const promo = new ethers.Contract(router, PROMO_ABI, provider);

  const [
    isActive,
    endTime,
    bonusBps,
    minPay,
    stats
  ] = await Promise.all([
    promo.promoActive().catch(() => false),
    promo.promoEndTime().catch(() => 0n),
    promo.bonusBps().catch(() => 0n),
    promo.minPaymentAmount().catch(() => 0n),
    promo.getStats().catch(() => [0n,0n,0n,0n]),
  ]);

  const poolTotal  = BigInt(stats[0]);
  const bonusSpent = BigInt(stats[1]);
  const refSpent   = BigInt(stats[2]);
  const remaining  = BigInt(stats[3]);
  const sold       = bonusSpent + refSpent;

  // ✅ РАСПРЕДЕЛЕНИЕ 1,000,000
  // Эти id должны быть в твоём HTML (или совпасть с одним из вариантов ниже)
  setFirst(["cap","totalOnContract","total_on_contract"], fmtIBITI(poolTotal));
  setFirst(["sold","soldTotal","sold_total"], fmtIBITI(sold));
  setFirst(["left","remaining","remainingForSale","remaining_for_sale"], fmtIBITI(remaining));

  // бонус и рефералы (распределение)
  setFirst(["bonusPool","bonusSpent","bonus_spent"], fmtIBITI(bonusSpent));
  setFirst(["refReserve","refSpent","ref_spent"], fmtIBITI(refSpent));

  // main sale pool — по сути это то же “общий пул”, но оставлю как total
  setFirst(["salePool","mainSalePool","main_sale_pool"], fmtIBITI(poolTotal));

  const bonusPct = (Number(bonusBps) / 100).toFixed(2);
  const endTxt = (BigInt(endTime) === 0n) ? "∞" : new Date(Number(endTime) * 1000).toLocaleString();

  setFirst(
    ["lastUpdated","saleUpdated","updatedAt"],
    `Updated: ${nowStamp()} | ${active.name} | promo=${isActive} | bonus=${bonusPct}% | minPay=${ethers.formatUnits(minPay, 18)} USDT | end=${endTxt}`
  );

  console.log("📊 PROMO STATS:", {
    chainId: active.chainId,
    router,
    poolTotal: fmtIBITI(poolTotal),
    bonusSpent: fmtIBITI(bonusSpent),
    refSpent: fmtIBITI(refSpent),
    remaining: fmtIBITI(remaining),
  });
}

export async function initSaleContract() {
  // экспорт для wallet.js
  window.loadPromoStats = loadPromoStats;
  await loadPromoStats();

  // авто-обновление раз в 20 сек
  if (!window.__ibitiPromoTimer) {
    window.__ibitiPromoTimer = setInterval(loadPromoStats, 20000);
  }
}



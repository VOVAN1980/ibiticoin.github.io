import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";

console.log("✅ sale.js загружен");

const ZERO_ADDRESS = ethers.ZeroAddress;

// ===== helpers =====
const $ = (id) => document.getElementById(id);

function setStatsEmpty(note = "—") {
  ["cap","refReserve","salePool","sold","left","bonusPool","soldPercent"].forEach(id => {
    const el = $(id);
    if (el) el.textContent = note;
  });
  if ($("salesProgress")) $("salesProgress").style.width = "0%";
  if ($("lastUpdated")) $("lastUpdated").textContent = "Updated: " + note;
}

function fmt8(x) {
  try { return ethers.formatUnits(x, 8); } catch { return "0"; }
}
function fmt18(x) {
  try { return ethers.formatUnits(x, 18); } catch { return "0"; }
}

async function getProviderAndChain() {
  // если есть кошелёк — читаем сеть из него
  if (window.ethereum) {
    const p = new ethers.BrowserProvider(window.ethereum);
    const net = await p.getNetwork();
    return { provider: p, chainId: Number(net.chainId) };
  }
  // fallback — берём RPC активной сети из config
  const rpc = config?.active?.rpcUrl || "https://bsc-dataseed.binance.org/";
  const p = new ethers.JsonRpcProvider(rpc);
  const net = await p.getNetwork();
  return { provider: p, chainId: Number(net.chainId) };
}

// ===== PHASED SALE (опционально) =====
export async function initSaleContract() {
  if (!window.signer) {
    console.warn("🚨 signer не готов, пропускаем initSaleContract()");
    return;
  }
  if (window.phasedSale) return;

  const address = config?.active?.contracts?.PHASED_TOKENSALE;

  // ✅ главное: на testnet/promo может не быть phasedSale — это нормально
  if (!address) {
    console.warn("ℹ️ PHASED_TOKENSALE не задан — phased sale отключён (норм для promo/testnet)");
    return;
  }

  try {
    window.phasedSale = new ethers.Contract(address, PhasedTokenSaleAbi, window.signer);
    console.log("✓ window.phasedSale инициализирован:", address);
  } catch (error) {
    console.error("✖ Ошибка инициализации window.phasedSale:", error);
  }
}

export async function buyIBITI(amount, referrer = ZERO_ADDRESS) {
  await initSaleContract();

  if (!window.phasedSale) {
    throw new Error("Контракт продажи (PHASED_TOKENSALE) не настроен для этой сети");
  }

  try {
    const tx = await window.phasedSale.buy(amount, referrer);
    console.log("✓ Транзакция отправлена:", tx.hash);
    return tx;
  } catch (error) {
    const reason =
      error?.revert?.args?.[0] ||
      error?.shortMessage ||
      error?.data?.message ||
      error?.message ||
      "Неизвестная ошибка при покупке";

    console.warn("🔁 Ошибка внутри buyIBITI:", reason);
    throw new Error(reason);
  }
}

export function getSaleContract() {
  return window.phasedSale || null;
}

// ===== PROMO STATS (ReferralSwapRouter) =====
// ABI только для getPromoStats (1 eth_call, без логов)
const PROMO_ROUTER_STATS_ABI = [
  "function getPromoStats() view returns (uint256 buys,uint256 usdtIn,uint256 ibitiToBuyers,uint256 bonusPaid,uint256 refPaid,uint256 ibitiOnContract,uint256 ibitiWithdrawn,uint256 usdtWithdrawn)"
];

function getPromoRouterAddress(chainId) {
  // берём из config активной сети (самое надёжное)
  const addr = config?.active?.contracts?.REFERRAL_SWAP_ROUTER
           || config?.active?.contracts?.REFERRAL_SWAP_ROUTER_ADDRESS
           || config?.active?.contracts?.REFERRAL_SWAP_ROUTER_ADDRESS_TESTNET
           || config?.active?.contracts?.REFERRAL_SWAP_ROUTER_ADDRESS_MAINNET;

  // если config.active = testnet/mainnet — chainId совпадёт
  if (addr && ethers.isAddress(addr)) return addr;

  // fallback — если кто-то где-то держит window.PROMO_STATS (старый вариант)
  const cfg = window.PROMO_STATS?.[chainId];
  if (cfg?.router && ethers.isAddress(cfg.router)) return cfg.router;

  return "";
}

async function loadPromoStats() {
  try {
    const { provider, chainId } = await getProviderAndChain();

    const routerAddr = getPromoRouterAddress(chainId);

    // если промо-роутер не задан (например mainnet до деплоя) — просто показываем пусто
    if (!routerAddr) {
      setStatsEmpty("—");
      return;
    }

    const router = new ethers.Contract(routerAddr, PROMO_ROUTER_STATS_ABI, provider);

    // если у роутера нет getPromoStats — будет revert/ошибка, ловим и просто показываем —
    const s = await router.getPromoStats();

    // распаковка (ethers v6 возвращает объект с именами)
    const buys            = s.buys;
    const usdtIn          = s.usdtIn;          // 18
    const ibitiToBuyers   = s.ibitiToBuyers;   // 8
    const bonusPaid       = s.bonusPaid;       // 8
    const refPaid         = s.refPaid;         // 8
    const ibitiOnContract = s.ibitiOnContract; // 8

    // sold = всё, что ушло покупателям (received+bonus) + рефы
    const sold = ibitiToBuyers + refPaid;

    // "cap" в твоём UI = total allocated (sold + осталось на контракте)
    const cap = sold + ibitiOnContract;

    const soldPct = cap > 0n ? Number((sold * 10000n) / cap) / 100 : 0;

    // UI mapping под твой блок
    if ($("cap"))        $("cap").textContent        = fmt8(cap);
    if ($("refReserve")) $("refReserve").textContent = fmt8(refPaid);
    if ($("salePool"))   $("salePool").textContent   = fmt8(cap); // если хочешь иначе — скажи
    if ($("sold"))       $("sold").textContent       = fmt8(sold);
    if ($("left"))       $("left").textContent       = fmt8(ibitiOnContract);
    if ($("bonusPool"))  $("bonusPool").textContent  = fmt8(bonusPaid);

    if ($("soldPercent")) $("soldPercent").textContent = soldPct.toFixed(2) + "%";
    if ($("salesProgress")) $("salesProgress").style.width = Math.min(100, soldPct) + "%";

    if ($("lastUpdated")) {
      $("lastUpdated").textContent = "Updated: " + new Date().toLocaleString();
    }

    // можно логнуть, чтобы видеть что реально читается
    console.log("📊 PromoStats:", {
      chainId,
      router: routerAddr,
      buys: buys.toString(),
      usdtIn: fmt18(usdtIn),
      soldIBITI: fmt8(sold),
      leftIBITI: fmt8(ibitiOnContract),
      bonus: fmt8(bonusPaid),
      ref: fmt8(refPaid),
    });
  } catch (e) {
    console.error("Promo stats error:", e);
    setStatsEmpty("error");
  }
}

// autoload
(function boot() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadPromoStats);
  } else {
    loadPromoStats();
  }

  const btn = $("refreshStats");
  if (btn) btn.addEventListener("click", loadPromoStats);
})();

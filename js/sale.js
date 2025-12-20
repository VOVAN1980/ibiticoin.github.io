// js/sale.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";

console.log("✅ sale.js загружен");

// Чтобы в DevTools можно было писать IBITI_CONFIG.active.contracts...
window.IBITI_CONFIG = config;

// ------------------------------------------------------------
// 1) PHASED TOKEN SALE (опционально, может быть выключен)
// ------------------------------------------------------------

const ZERO_ADDRESS = ethers.ZeroAddress;

export async function initSaleContract() {
  // signer должен прийти из wallet.js (после connect)
  if (!window.signer) {
    console.warn("🚨 signer не готов — phased sale не инициализируем");
    return null;
  }

  const addr = config?.active?.contracts?.PHASED_TOKENSALE;
  if (!addr) {
    // Это НОРМАЛЬНО, если ты сейчас тестишь только promo-router
    window.phasedSale = null;
    console.warn("⚠️ PHASED_TOKENSALE не задан — phased sale отключён (норм для promo/testnet)");
    return null;
  }

  if (window.phasedSale) return window.phasedSale;

  try {
    window.phasedSale = new ethers.Contract(addr, PhasedTokenSaleAbi, window.signer);
    console.log("✓ window.phasedSale инициализирован:", addr);
    return window.phasedSale;
  } catch (e) {
    console.error("✖ initSaleContract failed:", e);
    window.phasedSale = null;
    return null;
  }
}

export function getSaleContract() {
  return window.phasedSale || null;
}

// Если вдруг когда-то будешь использовать phased-sale покупку:
export async function buyIBITI(amount, referrer = ZERO_ADDRESS) {
  const c = await initSaleContract();
  if (!c) throw new Error("PHASED_TOKENSALE отключён или не настроен");
  const tx = await c.buy(amount, referrer);
  console.log("✓ PHASED buy tx:", tx.hash);
  return tx;
}

// ------------------------------------------------------------
// 2) PROMO STATS (ReferralSwapRouter) — это ДРУГОЙ МИР
// ------------------------------------------------------------

// Мини-ABI для чтения статов.
// Я делаю 2 стратегии:
// A) пробую getPromoStats() (если он есть в твоём “stats”-контракте)
// B) если нет — хотя бы читаю IBITI balance и базовые параметры, без падения
const PROMO_ABI = [
  // A) “stats” метод (если есть)
  "function getPromoStats() view returns (bool promoActive, uint16 bonusPercent, uint256 minUsdtAmount, uint256 refRewardAmount, uint256 buys, uint256 usdtIn, uint256 soldIBITI, uint256 bonusIBITI, uint256 refIBITI, uint256 ibitiOnContract)",

  // B) fallback чтение параметров (если getPromoStats нет)
  "function promoActive() view returns (bool)",
  "function bonusPercent() view returns (uint16)",
  "function minUsdtAmount() view returns (uint256)",
  "function refRewardAmount() view returns (uint256)"
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// --- Настройка ID элементов (подгони, если у тебя названия другие)
const UI_IDS = {
  // блок статистики
  totalOnContract: "stat_total_on_contract",     // “Total on contract”
  referralReserve: "stat_ref_reserve",          // “Referral reserve”
  mainSalePool:    "stat_main_pool",            // “Main sale pool”
  sold:            "stat_sold",                 // “Sold”
  remaining:       "stat_remaining",            // “Remaining for sale”
  bonusPool:       "stat_bonus_pool",           // “Bonus pool”
  soldPercent:     "stat_sold_percent",         // “Sold: X%”
  progressBar:     "sale_progress_bar",         // progress bar div
  updated:         "stat_updated",              // “Updated …”
  refreshBtn:      "promo_refresh_btn",         // кнопка Refresh

  // реф-ссылка
  refLink:         "ref_link",                  // элемент/инпут где показываем ссылку
  copyBtn:         "copy_ref_btn",              // Copy my link
  shareBtn:        "share_ref_btn"              // Share link
};

const $ = (id) => document.getElementById(id);

function fmt8(x) {
  try { return ethers.formatUnits(x ?? 0, 8); } catch { return "0"; }
}
function fmt18(x) {
  try { return ethers.formatUnits(x ?? 0, 18); } catch { return "0"; }
}
function nowStr() {
  const d = new Date();
  return d.toLocaleString();
}

async function getProviderAndChain() {
  if (window.ethereum) {
    const p = new ethers.BrowserProvider(window.ethereum);
    const net = await p.getNetwork();
    return { provider: p, chainId: Number(net.chainId) };
  }
  // fallback без кошелька
  const rpc = config?.active?.rpcUrl || "https://bsc-dataseed.binance.org/";
  const p = new ethers.JsonRpcProvider(rpc);
  const net = await p.getNetwork();
  return { provider: p, chainId: Number(net.chainId) };
}

function normalizePromoStats(obj) {
  // На случай, если ethers вернул и как массив, и как объект
  const get = (k, idx, def = 0n) => {
    const v = obj?.[k] ?? obj?.[idx];
    if (v === undefined || v === null) return def;
    try { return BigInt(v); } catch { return def; }
  };
  const getNum = (k, idx, def = 0) => {
    const v = obj?.[k] ?? obj?.[idx];
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  };
  const getBool = (k, idx, def = false) => {
    const v = obj?.[k] ?? obj?.[idx];
    return typeof v === "boolean" ? v : def;
  };

  return {
    promoActive: getBool("promoActive", 0, false),
    bonusPercent: getNum("bonusPercent", 1, 0),
    minUsdtAmount: get("minUsdtAmount", 2, 0n),
    refRewardAmount: get("refRewardAmount", 3, 0n),
    buys: get("buys", 4, 0n),
    usdtIn: get("usdtIn", 5, 0n),
    soldIBITI: get("soldIBITI", 6, 0n),
    bonusIBITI: get("bonusIBITI", 7, 0n),
    refIBITI: get("refIBITI", 8, 0n),
    ibitiOnContract: get("ibitiOnContract", 9, 0n)
  };
}

async function readPromoStats(provider) {
  const routerAddr = config?.active?.contracts?.REFERRAL_SWAP_ROUTER;
  const ibitiAddr  = config?.active?.contracts?.IBITI_TOKEN;

  if (!routerAddr) throw new Error("REFERRAL_SWAP_ROUTER не задан в config.active.contracts");
  if (!ibitiAddr)  throw new Error("IBITI_TOKEN не задан в config.active.contracts");

  const router = new ethers.Contract(routerAddr, PROMO_ABI, provider);

  // A) пробуем getPromoStats (самый норм)
  try {
    const raw = await router.getPromoStats();
    const s = normalizePromoStats(raw);
    return { routerAddr, ...s };
  } catch (e) {
    console.warn("⚠️ getPromoStats() недоступен — включаю fallback-режим статов");

    // B) fallback: читаем параметры + баланс IBITI на контракте
    const ibiti = new ethers.Contract(ibitiAddr, ERC20_ABI, provider);

    const [promoActive, bonusPercent, minUsdtAmount, refRewardAmount, bal] =
      await Promise.all([
        router.promoActive().catch(() => false),
        router.bonusPercent().catch(() => 0),
        router.minUsdtAmount().catch(() => 0n),
        router.refRewardAmount().catch(() => 0n),
        ibiti.balanceOf(routerAddr).catch(() => 0n)
      ]);

    return {
      routerAddr,
      promoActive: Boolean(promoActive),
      bonusPercent: Number(bonusPercent) || 0,
      minUsdtAmount: BigInt(minUsdtAmount || 0),
      refRewardAmount: BigInt(refRewardAmount || 0),
      buys: 0n,
      usdtIn: 0n,
      soldIBITI: 0n,
      bonusIBITI: 0n,
      refIBITI: 0n,
      ibitiOnContract: BigInt(bal || 0)
    };
  }
}

function renderPromoStats(s) {
  // Математика:
  // - “на контракте” = s.ibitiOnContract
  // - “выдано” = soldIBITI + bonusIBITI + refIBITI
  const issued = (s.soldIBITI || 0n) + (s.bonusIBITI || 0n) + (s.refIBITI || 0n);
  const total  = (s.ibitiOnContract || 0n) + issued;

  const soldToBuyers = (s.soldIBITI || 0n) + (s.bonusIBITI || 0n); // покупателю (включая бонус)
  const remaining = s.ibitiOnContract || 0n;

  const percent = total > 0n ? Number((issued * 10000n) / total) / 100 : 0;

  // Пишем в window для дебага
  window.PromoStats = {
    chainId: config?.active?.chainId,
    router: s.routerAddr,
    promoActive: s.promoActive,
    bonusPercent: s.bonusPercent,
    buys: s.buys?.toString?.() ?? String(s.buys ?? 0),
    usdtIn: s.usdtIn?.toString?.() ?? String(s.usdtIn ?? 0),
    soldIBITI: s.soldIBITI?.toString?.() ?? String(s.soldIBITI ?? 0),
    bonusIBITI: s.bonusIBITI?.toString?.() ?? String(s.bonusIBITI ?? 0),
    refIBITI: s.refIBITI?.toString?.() ?? String(s.refIBITI ?? 0)
  };
  console.log("📊 PromoStats:", window.PromoStats);

  // UI обновление (если элементов нет — просто молчим)
  const setText = (id, text) => { const el = $(id); if (el) el.textContent = text; };

  setText(UI_IDS.totalOnContract, fmt8(total) + " IBI");
  setText(UI_IDS.referralReserve, fmt8(s.refIBITI || 0n) + " IBI");
  setText(UI_IDS.mainSalePool, fmt8(total) + " IBI"); // если хочешь иначе — скажи, поменяем
  setText(UI_IDS.sold, fmt8(soldToBuyers) + " IBI");
  setText(UI_IDS.remaining, fmt8(remaining) + " IBI");
  setText(UI_IDS.bonusPool, fmt8(s.bonusIBITI || 0n) + " IBI");
  setText(UI_IDS.soldPercent, `Sold: ${percent.toFixed(2)}%`);

  const bar = $(UI_IDS.progressBar);
  if (bar) bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;

  const upd = $(UI_IDS.updated);
  if (upd) {
    const minUsdtHuman = fmt18(s.minUsdtAmount || 0n);
    const refRewardHuman = fmt8(s.refRewardAmount || 0n);
    upd.textContent = `${nowStr()} | promoActive=${s.promoActive} | bonus=${s.bonusPercent}% | minUSDT=${minUsdtHuman} | refReward=${refRewardHuman}`;
  }
}

// Публичная функция: дерни из консоли / из shop.js
export async function refreshPromoStats() {
  try {
    const { provider } = await getProviderAndChain();
    const s = await readPromoStats(provider);
    renderPromoStats(s);
    return s;
  } catch (e) {
    console.error("Promo stats error:", e);
    return null;
  }
}

// Авто-инициализация: кнопка Refresh + первый рендер
(function bootPromoStats() {
  // 1) разовый рендер
  refreshPromoStats();

  // 2) кнопка Refresh (если есть)
  const btn = $(UI_IDS.refreshBtn);
  if (btn) btn.addEventListener("click", () => refreshPromoStats());

  // 3) реф-ссылка + кнопки (если разметка есть)
  tryInitReferralUI();
})();

function tryInitReferralUI() {
  const linkEl = $(UI_IDS.refLink);
  const copyBtn = $(UI_IDS.copyBtn);
  const shareBtn = $(UI_IDS.shareBtn);

  if (!linkEl || !copyBtn || !shareBtn) return;

  function getAccount() {
    const acc =
      window?.selectedAccount ||
      window?.account ||
      (Array.isArray(window?.accounts) ? window.accounts[0] : null);
    return acc;
  }

  function buildRefLink(acc) {
    // ВАЖНО: ты сам сказал — ссылка появляется после покупки.
    // Но сама ссылка математически всегда = адрес кошелька.
    // Логику “показывать/не показывать” ты решай UI-ом.
    return `https://www.ibiticoin.com/shop.html?ref=${acc}`;
  }

  function setRefLink(acc) {
    if (!acc) return;
    const url = buildRefLink(acc);

    // если это input — value, иначе textContent
    if ("value" in linkEl) linkEl.value = url;
    else linkEl.textContent = url;
  }

  // дергаем сразу (если аккаунт уже есть)
  setRefLink(getAccount());

  // и обновляем при смене аккаунта
  if (window.ethereum?.on) {
    window.ethereum.on("accountsChanged", (accs) => setRefLink(accs?.[0]));
  }

  async function copyToClipboard(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    }
  }

  function readLinkText() {
    return ("value" in linkEl) ? linkEl.value : linkEl.textContent;
  }

  copyBtn.addEventListener("click", async () => {
    const acc = getAccount();
    if (!acc) return SwalFire("Connect wallet first");
    setRefLink(acc);

    const ok = await copyToClipboard(readLinkText());
    if (ok) SwalFire("✅ Ссылка скопирована");
    else SwalFire("❌ Не удалось скопировать");
  });

  shareBtn.addEventListener("click", async () => {
    const acc = getAccount();
    if (!acc) return SwalFire("Connect wallet first");
    setRefLink(acc);

    const url = readLinkText();
    if (navigator.share) {
      try {
        await navigator.share({ title: "IBITI Referral", url });
      } catch {}
      return;
    }
    const ok = await copyToClipboard(url);
    SwalFire(ok ? "✅ Ссылка скопирована" : "❌ Не удалось скопировать");
  });
}

function SwalFire(text) {
  if (window.Swal?.fire) {
    window.Swal.fire({ icon: "info", title: text, timer: 1500, showConfirmButton: false });
  } else {
    alert(text);
  }
}

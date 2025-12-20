import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";

console.log("✅ sale.js загружен");

// Стандартный Zero Address
const ZERO_ADDRESS = ethers.ZeroAddress;

/**
 * Инициализирует глобальный контракт window.phasedSale,
 * если он ещё не был инициализирован.
 */
export async function initSaleContract() {
  if (!window.signer) {
    console.warn("🚨 signer не готов, пропускаем initSaleContract()");
    return;
  }
  if (window.phasedSale) return;

  try {
    const address = config.active.contracts.PHASED_TOKENSALE;
    if (!address) throw new Error("PHASED_TOKENSALE не задан в config");
    window.phasedSale = new ethers.Contract(address, PhasedTokenSaleAbi, window.signer);
    console.log("✓ window.phasedSale инициализирован:", address);
  } catch (error) {
    console.error("✖ Ошибка инициализации window.phasedSale:", error);
  }
}

/**
 * Выполняет покупку токенов IBITI через контракт phasedSale.
 * @param {BigNumberish} amount — количество токенов (в smallest units)
 * @param {string} referrer — адрес пригласившего или ZeroAddress
 * @returns {Promise<ethers.TransactionResponse>}
 */
export async function buyIBITI(amount, referrer = ZERO_ADDRESS) {
  await initSaleContract();

  if (!window.phasedSale) {
    throw new Error("Контракт продажи не инициализирован");
  }

  try {
    const tx = await window.phasedSale.buy(amount, referrer);
    console.log("✓ Транзакция отправлена:", tx.hash);
    return tx;
  } catch (error) {
    // Гарантированно отдаем читаемое сообщение наружу
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

/**
 * Возвращает контракт продажи, если он уже инициализирован.
 * @returns {ethers.Contract|null}
 */
export function getSaleContract() {
  return window.phasedSale || null;
}

(async function initPromoStats() {
  if (typeof ethers === "undefined") return;

  const $ = (id) => document.getElementById(id);
  const fmt8 = (x) => ethers.formatUnits(x, 8);

  const REFERRAL_SWAP_ABI = [
    "event BoughtWithBonus(address indexed buyer,uint256 usdtIn,uint256 ibitiOut,uint256 bonus,address indexed referrer,uint256 refReward)",
    "event WithdrawIBITI(address indexed to,uint256 amount)"
  ];

  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  async function getProviderAndChain() {
    // 1) если есть кошелёк — используем его сеть
    if (window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum);
      const net = await p.getNetwork();
      return { provider: p, chainId: Number(net.chainId) };
    }
    // 2) fallback (если без кошелька)
    const rpc = "https://bsc-dataseed.binance.org/";
    const p = new ethers.JsonRpcProvider(rpc);
    const net = await p.getNetwork();
    return { provider: p, chainId: Number(net.chainId) };
  }

  async function getLogsChunked(provider, filter, step = 5000) {
    const latest = await provider.getBlockNumber();
    let from = Number(filter.fromBlock ?? 0);
    let to = Number(filter.toBlock ?? latest);

    if (from < 0) from = 0;
    if (to > latest) to = latest;

    const out = [];
    for (let start = from; start <= to; start += step + 1) {
      const end = Math.min(start + step, to);
      const part = await provider.getLogs({ ...filter, fromBlock: start, toBlock: end });
      out.push(...part);
    }
    return out;
  }

  const cfg = window.PROMO_STATS?.[chainId];

if (!cfg) {
  // сеть не поддержана
  ["cap","refReserve","salePool","sold","left","bonusPool","soldPercent"].forEach(id => $(id) && ($(id).textContent = "—"));
  if ($("salesProgress")) $("salesProgress").style.width = "0%";
  if ($("lastUpdated")) $("lastUpdated").textContent = "Updated: —";
  return;
}

if (!cfg.router || cfg.router === "") {
  // сеть поддержана, но промо-роутер ещё не задан (mainnet до деплоя)
  ["cap","refReserve","salePool","sold","left","bonusPool","soldPercent"].forEach(id => $(id) && ($(id).textContent = "—"));
  if ($("salesProgress")) $("salesProgress").style.width = "0%";
  if ($("lastUpdated")) $("lastUpdated").textContent = "Updated: promo not deployed";
  return;
}

      const ibiti = new ethers.Contract(cfg.ibiti, ERC20_ABI, provider);
      const dec = await ibiti.decimals(); // должно быть 8
      if (Number(dec) !== 8) console.warn("IBITI decimals != 8, got:", dec);

      const routerBal = await ibiti.balanceOf(cfg.router);

      // считаем, сколько IBITI ушло бонусом и рефералам по событиям
      const iface = new ethers.Interface(REFERRAL_SWAP_ABI);
      const topicBought = iface.getEvent("BoughtWithBonus").topicHash;
      const topicWdr    = iface.getEvent("WithdrawIBITI").topicHash;

      const fromBlock = Number(cfg.fromBlock || 0);

      const boughtLogs = await getLogsChunked(provider, {
        address: cfg.router,
        topics: [topicBought],
        fromBlock,
      });

      const wdrLogs = await getLogsChunked(provider, {
        address: cfg.router,
        topics: [topicWdr],
        fromBlock,
      });

      let totalBonus = 0n;
      let totalRef   = 0n;
      let totalWdr   = 0n;

      for (const l of boughtLogs) {
        const p = iface.parseLog(l);
        totalBonus += BigInt(p.args.bonus);
        totalRef   += BigInt(p.args.refReward);
      }
      for (const l of wdrLogs) {
        const p = iface.parseLog(l);
        totalWdr += BigInt(p.args.amount);
      }

      const spent = totalBonus + totalRef;                // потрачено из промо-пула
      const cap   = routerBal + spent + totalWdr;         // всего было выделено (примерно)

      const soldPct = cap > 0n ? Number((spent * 10000n) / cap) / 100 : 0;

      // UI
      if ($("cap"))        $("cap").textContent        = fmt8(cap);
      if ($("refReserve")) $("refReserve").textContent = fmt8(totalRef);
      if ($("salePool"))   $("salePool").textContent   = "0"; // пока
      if ($("sold"))       $("sold").textContent       = fmt8(spent);
      if ($("left"))       $("left").textContent       = fmt8(routerBal);
      if ($("bonusPool"))  $("bonusPool").textContent  = fmt8(totalBonus);

      if ($("soldPercent")) $("soldPercent").textContent = soldPct.toFixed(2) + "%";
      if ($("salesProgress")) $("salesProgress").style.width = Math.min(100, soldPct) + "%";

      if ($("lastUpdated")) {
        $("lastUpdated").textContent = "Updated: " + new Date().toLocaleString();
      }
    } catch (e) {
      console.error("Promo stats error:", e);
      if ($("lastUpdated")) $("lastUpdated").textContent = "Updated: error";
    }
  }

  // auto-load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadPromoStats);
  } else {
    loadPromoStats();
  }

  // refresh button
  const btn = document.getElementById("refreshStats");
  if (btn) btn.addEventListener("click", loadPromoStats);

})();


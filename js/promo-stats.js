import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";

const $ = (id) => document.getElementById(id);

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const REFERRAL_SWAP_ABI = [
  "event BoughtWithBonus(address indexed buyer,uint256 usdtIn,uint256 ibitiOut,uint256 bonus,address indexed referrer,uint256 refReward)",
  "event WithdrawIBITI(address indexed to,uint256 amount)"
];

function setDash(message = "Updated: —") {
  ["cap","refReserve","salePool","sold","left","bonusPool","soldPercent"].forEach(id => $(id) && ($(id).textContent = "—"));
  if ($("salesProgress")) $("salesProgress").style.width = "0%";
  if ($("lastUpdated")) $("lastUpdated").textContent = message;
}

async function getWalletChainId() {
  if (!window.ethereum) return null;
  const p = new ethers.BrowserProvider(window.ethereum);
  const net = await p.getNetwork();
  return Number(net.chainId);
}

async function getLogsChunked(provider, filter, step = 1000) {
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

async function loadPromoStats() {
  try {
    const walletChainId = await getWalletChainId();

    const netCfg =
      walletChainId === config.mainnet.chainId ? config.mainnet :
      walletChainId === config.testnet.chainId ? config.testnet :
      config.active; // fallback

    const chainId = netCfg.chainId;

    const ibitiAddr = netCfg.contracts.IBITI_TOKEN;
    const routerAddr = netCfg.contracts.REFERRAL_SWAP_ROUTER || "";

    if (!routerAddr) {
      setDash("Updated: promo not deployed");
      return;
    }

    // ✅ КРИТИЧНО: логи читаем НЕ через MetaMask, а через RPC
    const readProvider = new ethers.JsonRpcProvider(netCfg.rpcUrl);

    // fromBlock — лучше с блока деплоя промо-роутера
    // Добавь в config.testnet: promoDeployTx: "0x2195...."
    let fromBlock = 0;
    if (netCfg.promoDeployTx) {
      const r = await readProvider.getTransactionReceipt(netCfg.promoDeployTx);
      if (r?.blockNumber) fromBlock = r.blockNumber;
    }

    const ibiti = new ethers.Contract(ibitiAddr, ERC20_ABI, readProvider);
    const dec = await ibiti.decimals();
    if (Number(dec) !== 8) console.warn("IBITI decimals != 8, got:", dec);

    const routerBal = await ibiti.balanceOf(routerAddr);

    const iface = new ethers.Interface(REFERRAL_SWAP_ABI);
    const topicBought = iface.getEvent("BoughtWithBonus").topicHash;
    const topicWdr    = iface.getEvent("WithdrawIBITI").topicHash;

    const boughtLogs = await getLogsChunked(readProvider, { address: routerAddr, topics: [topicBought], fromBlock });
    const wdrLogs    = await getLogsChunked(readProvider, { address: routerAddr, topics: [topicWdr], fromBlock });

    let totalBonus = 0n, totalRef = 0n, totalWdr = 0n;

    for (const l of boughtLogs) {
      const p = iface.parseLog(l);
      totalBonus += BigInt(p.args.bonus);
      totalRef   += BigInt(p.args.refReward);
    }
    for (const l of wdrLogs) {
      const p = iface.parseLog(l);
      totalWdr += BigInt(p.args.amount);
    }

    const spent = totalBonus + totalRef;
    const cap   = routerBal + spent + totalWdr;
    const soldPct = cap > 0n ? Number((spent * 10000n) / cap) / 100 : 0;

    const fmt8 = (x) => ethers.formatUnits(x, 8);

    if ($("cap"))        $("cap").textContent        = fmt8(cap);
    if ($("refReserve")) $("refReserve").textContent = fmt8(totalRef);
    if ($("salePool"))   $("salePool").textContent   = "0";
    if ($("sold"))       $("sold").textContent       = fmt8(spent);
    if ($("left"))       $("left").textContent       = fmt8(routerBal);
    if ($("bonusPool"))  $("bonusPool").textContent  = fmt8(totalBonus);

    if ($("soldPercent")) $("soldPercent").textContent = soldPct.toFixed(2) + "%";
    if ($("salesProgress")) $("salesProgress").style.width = Math.min(100, soldPct) + "%";
    if ($("lastUpdated")) $("lastUpdated").textContent = "Updated: " + new Date().toLocaleString();

  } catch (e) {
    console.error("Promo stats error:", e);
    setDash("Updated: error");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadPromoStats);
} else {
  loadPromoStats();
}

const btn = document.getElementById("refreshStats");
if (btn) btn.addEventListener("click", loadPromoStats);

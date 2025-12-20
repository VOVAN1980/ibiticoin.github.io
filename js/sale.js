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

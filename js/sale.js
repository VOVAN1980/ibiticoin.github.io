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

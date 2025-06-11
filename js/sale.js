// js/sale.js

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";

console.log("✅ sale.js загружен");

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

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
    window.phasedSale = new ethers.Contract(address, PhasedTokenSaleAbi, window.signer);
    console.log("✓ window.phasedSale инициализирован:", address);
  } catch (error) {
    console.error("✖ Ошибка инициализации window.phasedSale:", error);
  }
}

/**
 * Выполняет покупку токенов IBITI через контракт phasedSale.
 * @param {BigNumberish} amount — количество токенов
 * @param {string} referrer — адрес пригласившего
 * @returns {Promise<ethers.TransactionResponse>}
 */
export async function buyIBITI(amount, referrer = NULL_ADDRESS) {
  await initSaleContract();

  if (!window.phasedSale) {
    throw new Error("window.phasedSale не инициализирован");
  }

  try {
    const tx = await window.phasedSale.buy(amount, referrer);
    console.log("✓ Транзакция buy отправлена:", tx.hash);
    return tx;
  } catch (error) {
    throw error;
  }
}

/**
 * Возвращает экземпляр контракта, если он уже инициализирован.
 * @returns {Contract|null}
 */
export function getSaleContract() {
  return window.phasedSale || null;
}

// js/sale.js

// Полагаемся на глобальный ethers (UMD)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";  // убрали
import config from "./config.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";

export let saleContract = null;

export async function initSaleContract() {
  if (!window.signer || !window.selectedAccount) return;
  if (saleContract) return;

  // Используем глобальный ethers
  saleContract = new ethers.Contract(
    config.mainnet.contracts.PHASED_TOKENSALE_ADDRESS_MAINNET,
    PhasedTokenSaleAbi,
    window.signer
  );

  if (saleContract.address) {
    console.log("✅ sale.js: PhasedTokenSale инициализирован", saleContract.address);
  }
}

export async function buyIBITI(amountFormatted, referrer) {
  if (!saleContract) {
    await initSaleContract();
  }
  if (!saleContract) {
    throw new Error("Контракт продажи не инициализирован");
  }
  return saleContract.buy(amountFormatted, referrer);
}

console.log("✅ sale.js загружен");

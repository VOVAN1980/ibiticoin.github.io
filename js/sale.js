// js/sale.js

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import config from "./config.js";
import { phasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";
import { selectedAccount } from "./wallet.js";

export let saleContract = null;

async function initSaleContract() {
  // Ждём, пока signer (и window.phasedSale) инициализируются в wallet.js
  if (!window.phasedSale || !selectedAccount) {
    return;
  }
  if (saleContract) return;

  const signer = window.phasedSale.signer;
  saleContract = new ethers.Contract(
    config.mainnet.contracts.PHASED_TOKENSALE_ADDRESS_MAINNET,
    phasedTokenSaleAbi,
    signer
  );
  console.log("✅ sale.js: PhasedTokenSale инициализирован", saleContract.address);
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

// При загрузке страницы пытаемся инициализировать контракт
initSaleContract();
console.log("✅ sale.js загружен");

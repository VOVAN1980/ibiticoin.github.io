// js/sale.js

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import config from "./config.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";

export let saleContract = null;

async function initSaleContract() {
  // используем глобальные window.selectedAccount и window.signer
  if (!window.signer || !window.selectedAccount) return;
  if (saleContract) return;

  saleContract = new ethers.Contract(
    config.mainnet.contracts.PHASED_TOKENSALE_ADDRESS_MAINNET,
    PhasedTokenSaleAbi,
    window.signer
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

initSaleContract();
console.log("✅ sale.js загружен");

// js/sale.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import config from "./config.js";
import { phasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";
import { signer } from "./wallet.js";

// Экземпляр контракта PhasedTokenSale
export const saleContract = new ethers.Contract(
  config.mainnet.contracts.PHASED_TOKENSALE_ADDRESS_MAINNET,
  phasedTokenSaleAbi,
  signer
);

// Обёртка для покупки (USDT)
export function buyIBITI(amountFormatted, referrer) {
  // «buy» в контракте PhasedTokenSale
  return saleContract.buy(amountFormatted, referrer);
}

console.log("✅ sale.js загружен; PhasedTokenSale at", saleContract.target || saleContract.address);

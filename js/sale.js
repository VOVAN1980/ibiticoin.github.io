// js/sale.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import config from "./config.js";
import { phasedTokenSaleAbi } from "./abis/phasedTokenSaleAbi.js";

// 1) Провайдер и signer
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer   = provider.getSigner();

// 2) Экземпляр контракта PhasedTokenSale
export const saleContract = new ethers.Contract(
  config.mainnet.contracts.PHASED_TOKENSALE_ADDRESS_MAINNET,
  phasedTokenSaleAbi,
  signer
);

// 3) Обёртка для покупки
export function buyIBITI(amountFormatted, referrer) {
  return saleContract.buy(amountFormatted, referrer);
}

// Лог для проверки
console.log("✅ sale.js загружен; PhasedTokenSale at", saleContract.address);

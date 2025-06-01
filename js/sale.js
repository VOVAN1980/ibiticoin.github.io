// js/sale.js

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import config from "./config.js";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";
import { selectedAccount } from "./wallet.js";

export let saleContract = null;

async function initSaleContract() {
  if (!window.phasedSale || !selectedAccount) return;
  if (saleContract) return;

  // В ethers.js v6 контракт внутри window.phasedSale создаётся с runner,
  // но это не полноценный signer — нужно достать его вручную
  const signer = await window.phasedSale.runner;

  if (!signer?.provider?.sendTransaction) {
    console.error("❌ Runner не поддерживает отправку транзакций");
    throw new Error("Signer не поддерживает отправку транзакций");
  }

  saleContract = new ethers.Contract(
    config.mainnet.contracts.PHASED_TOKENSALE_ADDRESS_MAINNET,
    PhasedTokenSaleAbi,
    signer // 👈 теперь это полноценный Signer (runner)
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

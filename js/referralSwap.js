// js/referralSwap.js (FINAL BUY + RECEIPT)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";

// чтобы receipt-widget мог парсить/форматировать
window.ethers = window.ethers || ethers;

const SWAP_ABI = [
  "function buyWithReferral(uint256 paymentAmount,address referrer,uint256 minIbitiOut) external",
  "function minPaymentAmount() view returns (uint256)"
];

const ROUTER_ABI = [
  "function getAmountsOut(uint256 amountIn,address[] calldata path) external view returns (uint256[] memory amounts)"
];

const ERC20_ABI = [
  "function approve(address spender,uint256 amount) external returns (bool)",
  "function decimals() view returns (uint8)"
];

function getRefFromUrl() {
  const q = new URLSearchParams(location.search);
  const ref = q.get("ref");
  if (!ref) return ethers.ZeroAddress;
  try { return ethers.getAddress(ref); } catch { return ethers.ZeroAddress; }
}

export async function buyPromo(usdtHuman) {
  const active = await config.getActive();
  config.active = active;

  // сеть
  await config.ensureWalletOnActive();

  if (!window.ethereum) throw new Error("No wallet");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const user = await signer.getAddress();

  const USDT = active.contracts.USDT_TOKEN;
  const IBITI = active.contracts.IBITI_TOKEN;
  const SWAP = active.contracts.REFERRAL_SWAP_ROUTER;
  const PAN  = active.contracts.PANCAKESWAP_ROUTER;

  if (!SWAP) throw new Error("Promo router not set");

  // заранее подгружаем чек (чтобы точно был готов после tx)
  if (typeof window.ensureIbitiReceipt === "function") {
    try { await window.ensureIbitiReceipt(); } catch (_) {}
  }

  const usdt = new ethers.Contract(USDT, ERC20_ABI, signer);
  const usdtDec = Number(await usdt.decimals().catch(() => 18));
  const amountIn = ethers.parseUnits(String(usdtHuman), usdtDec);

  const promo = new ethers.Contract(SWAP, SWAP_ABI, signer);
  const minPay = await promo.minPaymentAmount().catch(() => 0n);
  if (minPay > 0n && amountIn < minPay) {
    throw new Error("Минимум по акции: 10 USDT");
  }

  // minOut через Pancake (3% slippage)
  let minOut = 0n;
  try {
    const r = new ethers.Contract(PAN, ROUTER_ABI, provider);
    const amounts = await r.getAmountsOut(amountIn, [USDT, IBITI]);
    const expected = amounts[amounts.length - 1];
    minOut = (expected * 97n) / 100n;
  } catch {}

  let ref = getRefFromUrl();
  if (ref && ref.toLowerCase() === user.toLowerCase()) ref = ethers.ZeroAddress;

  // approve
  await (await usdt.approve(SWAP, amountIn)).wait();

  // buy
  const tx = await promo.buyWithReferral(amountIn, ref, minOut);
  const receipt = await tx.wait();

  // чек
  let receiptShown = false;
  try {
    if (typeof window.ensureIbitiReceipt === "function") {
      await window.ensureIbitiReceipt();
    }
    if (window.IBITI_RECEIPT?.showFromReceipt) {
      await window.IBITI_RECEIPT.showFromReceipt({
        receipt,
        buyer: user,
        usdtDecimals: usdtDec
      });
      receiptShown = true;
    }
  } catch (e) {
    console.warn("Receipt UI failed:", e);
  }

  // остальная логика
  if (typeof window.enableReferralAfterPurchase === "function") {
    window.enableReferralAfterPurchase(user);
  }
  if (typeof window.loadPromoStats === "function") {
    window.loadPromoStats();
  }

  if (!receiptShown) {
    alert("✅ Покупка по акции выполнена");
  }
}

export function initPromoButton() {
  const btn = document.getElementById("promoBuyButton");
  const input = document.getElementById("promoUsdtAmount");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      const v = input ? input.value : "10";
      await buyPromo(v);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Ошибка покупки");
    }
  });
}

// js/referralSwap.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config     from "./config.js";

const USDT  = config.active.contracts.USDT_TOKEN;
const IBITI = config.active.contracts.IBITI_TOKEN;
const SWAP  = config.active.contracts.REFERRAL_SWAP_ROUTER;
const PANCAKE_ROUTER = config.active.contracts.PANCAKESWAP_ROUTER;

const SWAP_ABI = [
  "function buyWithReferral(uint256 usdtAmountIn,uint256 minIbitiOut,address referrer,uint256 deadline) external"
];

const ROUTER_ABI = [
  "function getAmountsOut(uint256 amountIn,address[] calldata path) external view returns (uint256[] memory amounts)"
];

function getRefFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (!ref) return ethers.ZeroAddress;
  try {
    return ethers.getAddress(ref);
  } catch {
    return ethers.ZeroAddress;
  }
}

// основная покупка по акции
export async function buyPromoWithBonus(usdtAmountHuman) {
  if (!window.signer || !window.selectedAccount) {
    alert("Сначала подключи кошелёк.");
    return;
  }

  const signer   = window.signer;
  const userAddr = window.selectedAccount;
  const provider = signer.provider;

  // 1) минимум 10 USDT
  const amount = Number(usdtAmountHuman);
  if (!amount || amount < 10) {
    alert("Минимальная покупка по акции — 10 USDT.");
    return;
  }

  const usdtAmountIn = ethers.parseUnits(amount.toString(), 18); // BSC USDT: 18 знаков

  // 2) считаем minOut через Pancake (с 3% запасом)
  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, provider);
  const path   = [USDT, IBITI];
  const amounts = await router.getAmountsOut(usdtAmountIn, path);
  const expectedIbiti = amounts[amounts.length - 1];
  const minIbitiOut   = (expectedIbiti * 97n) / 100n; // 3% slippage

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 10 * 60); // +10 минут

  // 3) реферер из URL, запрет self-ref
  let referrer = getRefFromUrl();
  try {
    if (ethers.getAddress(referrer) === ethers.getAddress(userAddr)) {
      referrer = ethers.ZeroAddress;
    }
  } catch {
    referrer = ethers.ZeroAddress;
  }

  const usdt = new ethers.Contract(
    USDT,
    ["function approve(address spender,uint256 amount) external returns (bool)"],
    signer
  );
  const swap = new ethers.Contract(SWAP, SWAP_ABI, signer);

  // 4) approve USDT -> наш роутер
  const txApprove = await usdt.approve(SWAP, usdtAmountIn);
  await txApprove.wait();

  // 5) своп + бонус + рефералка
  const tx = await swap.buyWithReferral(usdtAmountIn, minIbitiOut, referrer, deadline);
  console.log("Promo buy tx:", tx.hash);
  await tx.wait();

  // 6) включаем показ реф-ссылки теми же окнами, что и сейл
  if (typeof window.enableReferralAfterPurchase === "function") {
    window.enableReferralAfterPurchase(userAddr);
  }

  alert("Готово! Покупка с новогодним бонусом проведена.");
}

// инициализируем кнопку на странице
export function initPromoButton() {
  const btn   = document.getElementById("promoBuyButton");
  const input = document.getElementById("promoUsdtAmount");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const val = input ? input.value : "10";
    try {
      await buyPromoWithBonus(val);
    } catch (e) {
      console.error(e);
      alert(e.message || "Ошибка при покупке по акции");
    }
  });
}

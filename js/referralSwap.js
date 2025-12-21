// js/referralSwap.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";

const SWAP_ABI = [
  "function buyWithReferral(uint256 paymentAmount,address referrer,uint256 minIbitiOut) external",
  "function minPaymentAmount() view returns (uint256)",
  "function promoActive() view returns (bool)"
];

const ROUTER_ABI = [
  "function getAmountsOut(uint256 amountIn,address[] calldata path) external view returns (uint256[] memory amounts)"
];

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function approve(address spender,uint256 amount) external returns (bool)"
];

function getRefFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (!ref) return ethers.ZeroAddress;
  try { return ethers.getAddress(ref); } catch { return ethers.ZeroAddress; }
}

async function ensureCorrectNetwork(signer, requiredChainId) {
  const net = await signer.provider.getNetwork();
  const cid = Number(net.chainId);
  if (cid !== requiredChainId) {
    alert(`Wrong network: chainId ${cid}. Required: ${requiredChainId}.`);
    throw new Error("Wrong network");
  }
}

export async function buyPromoWithBonus(usdtAmountHuman) {
  if (!window.signer || !window.selectedAccount) {
    alert("Сначала подключи кошелёк.");
    return;
  }

  const signer = window.signer;
  const userAddr = window.selectedAccount;
  const provider = signer.provider;

  // ✅ берём актуальную сеть и адреса на момент клика
  const active = await config.getActive();
  const { USDT_TOKEN: USDT, IBITI_TOKEN: IBITI, REFERRAL_SWAP_ROUTER: SWAP, PANCAKESWAP_ROUTER } = active.contracts;

  if (!SWAP) {
    alert("Promo router ещё не настроен для этой сети.");
    return;
  }

  await ensureCorrectNetwork(signer, active.chainId);

  const amount = Number(usdtAmountHuman);
  if (!amount || amount <= 0) {
    alert("Введи сумму в USDT.");
    return;
  }

  const usdt = new ethers.Contract(USDT, ERC20_ABI, signer);
  const usdtDec = await usdt.decimals();

  const usdtAmountIn = ethers.parseUnits(amount.toString(), usdtDec);

  const router = new ethers.Contract(PANCAKESWAP_ROUTER, ROUTER_ABI, provider);
  const swap = new ethers.Contract(SWAP, SWAP_ABI, signer);

  // проверим что акция активна и минимум
  const promoActive = await swap.promoActive().catch(() => true);
  if (!promoActive) {
    alert("Promo сейчас выключена.");
    return;
  }

  const minPay = await swap.minPaymentAmount().catch(() => 0n);
  if (minPay > 0n && usdtAmountIn < minPay) {
    alert("Минимальная покупка по акции — 10 USDT.");
    return;
  }

  // minOut по пулу (3% slippage)
  let minIbitiOut = 0n;
  try {
    const path = [USDT, IBITI];
    const amounts = await router.getAmountsOut(usdtAmountIn, path);
    const expected = amounts[amounts.length - 1];
    minIbitiOut = (expected * 97n) / 100n;
  } catch (e) {
    console.warn("getAmountsOut failed -> minOut=0", e);
    minIbitiOut = 0n;
  }

  // referrer
  let referrer = getRefFromUrl();
  try {
    if (ethers.getAddress(referrer) === ethers.getAddress(userAddr)) referrer = ethers.ZeroAddress;
  } catch {
    referrer = ethers.ZeroAddress;
  }

  // approve + buy
  const txApprove = await usdt.approve(SWAP, usdtAmountIn);
  await txApprove.wait();

  const tx = await swap.buyWithReferral(usdtAmountIn, referrer, minIbitiOut);
  console.log("Promo buy tx:", tx.hash);
  await tx.wait();

  if (typeof window.enableReferralAfterPurchase === "function") {
    window.enableReferralAfterPurchase(userAddr);
  }

  alert("✅ Покупка по акции прошла.");
}

export function initPromoButton() {
  const btn = document.getElementById("promoBuyButton");
  const input = document.getElementById("promoUsdtAmount");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const val = input ? input.value : "10";
    try { await buyPromoWithBonus(val); }
    catch (e) { console.error(e); alert(e?.message || "Ошибка покупки"); }
  });
}

// js/referralSwap.js (FINAL BUY + AUTO WHITE RECEIPT)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";

// отдаём ethers в window (если понадобится дальше)
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

function getPublicRpcUrls(active) {
  const net = window.IBITI_CONFIG?.getNet?.() || {};
  const urls = [
    ...(Array.isArray(net.rpcUrls) ? net.rpcUrls : []),
    ...(Array.isArray(active?.rpcUrls) ? active.rpcUrls : []),
    net.rpcUrl, net.RPC_URL,
    active?.rpcUrl, active?.RPC_URL, active?.rpc
  ].filter(Boolean).map(String);

  return [...new Set(urls)];
}

async function waitReceiptViaAnyRpc(txHash, rpcUrls, confirmations = 1, timeoutMs = 120000) {
  for (const url of rpcUrls) {
    try {
      const rp = new ethers.JsonRpcProvider(url);
      const rc = await rp.waitForTransaction(txHash, confirmations, timeoutMs);
      if (rc) return rc;
    } catch (e) {
      console.warn("RPC failed:", url, e?.message || e);
    }
  }
  return null;
}

export async function buyPromo(usdtHuman) {
  const active = await config.getActive();
  config.active = active;

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

  // чек-виджет гарантированно существует (мы его вшили в shop.html)
  if (typeof window.ensureIbitiReceipt === "function") {
    await window.ensureIbitiReceipt();
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

  // 1) показываем чек сразу (Pending)
  try {
    await window.IBITI_RECEIPT?.showFromTxHash?.({
      txHash: tx.hash,
      buyer: user,
      usdtDecimals: usdtDec,
      ibitiDecimals: 8,
      paidHuman: usdtHuman
    });
  } catch (e) {
    console.warn("showFromTxHash failed:", e);
  }

  // 2) ждём receipt через публичные RPC (без кошелькового RPC-цирка)
  const rpcUrls = getPublicRpcUrls(active);
  let receipt = await waitReceiptViaAnyRpc(tx.hash, rpcUrls, 1, 120000);

  // fallback на кошелёк если всё совсем плохо
  if (!receipt) {
    try { receipt = await tx.wait(); } catch (_) {}
  }

  // 3) обновляем чек реальным receipt
  if (receipt) {
    try {
      await window.IBITI_RECEIPT?.showFromReceipt?.({
        receipt,
        txHash: tx.hash,
        buyer: user,
        usdtDecimals: usdtDec,
        ibitiDecimals: 8
      });
    } catch (e) {
      console.warn("showFromReceipt failed:", e);
    }
  }

  // остальная логика
  if (typeof window.enableReferralAfterPurchase === "function") {
    window.enableReferralAfterPurchase(user);
  }
  if (typeof window.loadPromoStats === "function") {
    window.loadPromoStats();
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

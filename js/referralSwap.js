// js/referralSwap.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config     from "./config.js";

// --- адреса из конфига (testnet) ---
const USDT           = config.active.contracts.USDT_TOKEN;
const IBITI          = config.active.contracts.IBITI_TOKEN;
const SWAP           = config.active.contracts.REFERRAL_SWAP_ROUTER;
const PANCAKE_ROUTER = config.active.contracts.PANCAKESWAP_ROUTER;

// chainId BSC Testnet
const REQUIRED_CHAIN_ID = 97;

// ABI промо-контракта и роутера
const SWAP_ABI = [
  // только функция покупки, БЕЗ promoActive()
  "function buyWithReferral(uint256 usdtAmountIn,uint256 minIbitiOut,address referrer,uint256 deadline) external"
];

const ROUTER_ABI = [
  "function getAmountsOut(uint256 amountIn,address[] calldata path) external view returns (uint256[] memory amounts)"
];

// рефка из URL (?ref=0x...)
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

// проверяем, что кошелёк реально в testnet (chainId 97)
async function ensureTestnet(signer) {
  try {
    const net = await signer.provider.getNetwork();
    const cid = Number(net.chainId);
    if (cid !== REQUIRED_CHAIN_ID) {
      alert(`Сейчас сеть кошелька = chainId ${cid}. Нужна BSC Testnet (chainId 97).`);
      throw new Error("Wrong network");
    }
  } catch (e) {
    console.warn("ensureTestnet error:", e);
  }
}

// основная покупка по акции
export async function buyPromoWithBonus(usdtAmountHuman) {
  if (!window.signer || !window.selectedAccount) {
    alert("Сначала подключи кошелёк.");
    return;
  }

  if (!SWAP) {
    alert("Промо-контракт ещё не настроен. Попробуй позже или купи через PancakeSwap.");
    return;
  }

  const signer   = window.signer;
  const userAddr = window.selectedAccount;
  const provider = signer.provider;

  await ensureTestnet(signer);

  // минимум 10 USDT
  const amount = Number(usdtAmountHuman);
  if (!amount || amount < 10) {
    alert("Минимальная покупка по акции — 10 USDT.");
    return;
  }

  const usdtAmountIn = ethers.parseUnits(amount.toString(), 6);  // mUSDT testnet: 6 знаков

  // инстансы контрактов
  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, provider);
  const usdt   = new ethers.Contract(
    USDT,
    ["function approve(address spender,uint256 amount) external returns (bool)"],
    signer
  );
  const swap = new ethers.Contract(SWAP, SWAP_ABI, signer);

  try {
    // 1) считаем minOut через Pancake (3% slippage)
    let minIbitiOut = 0n;

    try {
      const path    = [USDT, IBITI];
      const amounts = await router.getAmountsOut(usdtAmountIn, path);
      const expectedIbiti = amounts[amounts.length - 1];
      minIbitiOut        = (expectedIbiti * 97n) / 100n; // -3% запас
    } catch (e) {
      console.warn(
        "⚠ getAmountsOut не сработал (скорее всего, на testnet нет пула IBITI/USDT). " +
        "Идём с minOut = 0.",
        e
      );
      minIbitiOut = 0n;
    }

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 10 * 60); // +10 минут

    // 2) реферер из URL, запрет self-ref
    let referrer = getRefFromUrl();
    try {
      if (ethers.getAddress(referrer) === ethers.getAddress(userAddr)) {
        referrer = ethers.ZeroAddress;
      }
    } catch {
      referrer = ethers.ZeroAddress;
    }

    // 3) approve USDT -> наш промо-контракт
    const txApprove = await usdt.approve(SWAP, usdtAmountIn);
    await txApprove.wait();

    // 4) своп + бонус + рефералка
    const tx = await swap.buyWithReferral(usdtAmountIn, minIbitiOut, referrer, deadline);
    console.log("Promo buy tx:", tx.hash);
    await tx.wait();

    // 5) включаем показ реф-ссылки тем же окном, что и обычный сейл
    if (typeof window.enableReferralAfterPurchase === "function") {
      window.enableReferralAfterPurchase(userAddr);
    }

    alert("Готово! Покупка с новогодним бонусом проведена.");
  } catch (e) {
    console.error(e);
    const raw = e?.message || "";
    const msg = raw.toLowerCase();

    if (msg.includes("promo off") || msg.includes("promoactive")) {
      alert("Новогодняя акция IBITI завершена.\nДальнейшая покупка — напрямую через PancakeSwap.");
      return;
    }

    if (msg.includes("not enough ibiti pool")) {
      alert("Бонусный пул IBITI по акции исчерпан.\nПокупка доступна напрямую через PancakeSwap.");
      return;
    }

    if (msg.includes("amount < min")) {
      alert("Сумма меньше минимальной для акции (10 USDT).");
      return;
    }

    if (msg.includes("deadline")) {
      alert("Транзакция просрочена. Попробуй ещё раз.");
      return;
    }

    alert(raw || "Ошибка при покупке по акции.");
  }
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

// js/liquidity.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import config      from "./config.js";

// Мини-ABI для Factory и Pair
const factoryAbi = [
  "function getPair(address,address) view returns (address)"
];
const pairAbi = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

let provider, factory;

async function init() {
  if (!window.ethereum) return;
  provider = new ethers.providers.Web3Provider(window.ethereum);
  factory  = new ethers.Contract(
    config.mainnet.contracts.PANCAKESWAP_FACTORY_ADDRESS_MAINNET,
    factoryAbi,
    provider
  );
  document.getElementById("refreshLiquidityBtn")
          .addEventListener("click", fetchLiquidity);
  await fetchLiquidity();
}

async function fetchLiquidity() {
  try {
    const A = config.mainnet.contracts.IBITI_TOKEN_ADDRESS_MAINNET;
    const B = config.mainnet.contracts.USDT_TOKEN_ADDRESS_MAINNET;
    const pairAddr = await factory.getPair(A, B);
    if (pairAddr === ethers.constants.AddressZero) {
      throw new Error("Пул IBITI/USDT не найден");
    }
    const pair = new ethers.Contract(pairAddr, pairAbi, provider);
    const [t0, t1] = await Promise.all([pair.token0(), pair.token1()]);
    const [r0, r1] = await pair.getReserves();

    let reserveToken, reserveUSDT;
    if (t0.toLowerCase() === A.toLowerCase()) {
      reserveToken = ethers.utils.formatUnits(r0, 8);
      reserveUSDT  = ethers.utils.formatUnits(r1, 18);
    } else {
      reserveToken = ethers.utils.formatUnits(r1, 8);
      reserveUSDT  = ethers.utils.formatUnits(r0, 18);
    }

    document.getElementById("reserveToken").innerText = reserveToken;
    document.getElementById("reserveUSDT").innerText  = reserveUSDT;
  } catch (e) {
    console.error("Ошибка ликвидности:", e);
    document.getElementById("reserveToken").innerText = "—";
    document.getElementById("reserveUSDT").innerText  = "—";
  }
}

document.addEventListener("DOMContentLoaded", init);
console.log("✅ liquidity.js загружен");

// js/stats.js
import { saleContract } from "./sale.js";

export async function loadSaleStats() {
  try {
    const decimals = 8;
    const format = val => (Number(val) / 10 ** decimals).toLocaleString("en-US");

    const cap     = await saleContract.saleCap();
    const sold    = await saleContract.totalSold();
    const reserve = await saleContract.rewardReserve();
    const paid    = await saleContract.totalReferralPaid();

    document.getElementById("cap").innerText        = format(cap);
    document.getElementById("sold").innerText       = format(sold);
    document.getElementById("left").innerText       = format(cap - sold);
    document.getElementById("refReserve").innerText = format(reserve);
    document.getElementById("refLeft").innerText    = format(reserve - paid);

  } catch (err) {
    console.warn("Не удалось загрузить статистику токенсейла:", err);
  }
}

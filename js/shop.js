// js/shop.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";
import { buyIBITI, getSaleContract } from "./sale.js";
import { connectWallet, selectedAccount, showIbitiBalance } from "./wallet.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";
import { PhasedTokenSaleAbi } from "./abis/PhasedTokenSaleAbi.js";
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";

const rpcProvider = new ethers.JsonRpcProvider(config.active.rpcUrl);
const readSaleContract = new ethers.Contract(
  config.active.contracts.PHASED_TOKENSALE,
  PhasedTokenSaleAbi,
  rpcProvider
);
const ibitiTokenRead = new ethers.Contract(
  config.active.contracts.IBITI_TOKEN,
  ibitiTokenAbi,
  rpcProvider
);

async function loadSaleStats() {
  const elements = ["cap", "refReserve", "salePool", "sold", "left", "bonusPool", "salesProgress", "soldPercent", "lastUpdated"]
    .reduce((acc, id) => ({ ...acc, [id]: document.getElementById(id) }), {});

  const saleContract = getSaleContract() || readSaleContract;
  if (!saleContract) return;

  try {
    const saleAddr = config.active.contracts.PHASED_TOKENSALE;
    const depositBN = await ibitiTokenRead.balanceOf(saleAddr).catch(() => 0n);
    const cap = Number(ethers.formatUnits(depositBN, 8));

    let soldBN = 0n;
    for (let i = 0; i < 3; i++) {
      const p = await saleContract.phases(i);
      soldBN += BigInt(p.sold.toString());
    }
    const sold = Number(ethers.formatUnits(soldBN, 8));
    const refReserve = Number(ethers.formatUnits(await saleContract.rewardTokens(), 8));
    const bonusReserve = await saleContract.rewardReserve().then(r => Number(ethers.formatUnits(r, 8))).catch(() => 500_000);

    const salePool = cap - refReserve - bonusReserve;
    const left = salePool - sold;
    const percent = salePool > 0 ? (sold / salePool) * 100 : 0;

    const fmt = x => x.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    elements.cap.innerText = fmt(cap);
    elements.refReserve.innerText = fmt(refReserve);
    elements.salePool.innerText = fmt(salePool);
    elements.sold.innerText = fmt(sold);
    elements.left.innerText = fmt(left);
    elements.bonusPool.innerText = fmt(bonusReserve);
    elements.salesProgress.style.width = `${Math.min(Math.max(percent, 0), 100)}%`;
    elements.soldPercent.innerText = `${percent.toFixed(2)}%`;
    elements.lastUpdated.innerText = `Обновлено: ${new Date().toLocaleTimeString("ru-RU")}`;
  } catch (e) {
    console.warn("Ошибка загрузки статистики токенсейла:", e);
  }
}

async function loadReferralStats(account) {
  const rewardEl = document.getElementById("refReward");
  const refCountEl = document.getElementById("refCount");
  const statsBlock = document.getElementById("referralStats");
  if (!rewardEl || !refCountEl || !statsBlock) return;

  const saleContract = getSaleContract();
  if (!saleContract) return;

  try {
    const rawRef = await saleContract.referralRewards(account);
    refCountEl.innerText = Math.floor(Number(ethers.formatUnits(rawRef, 8)));

    const filter = readSaleContract.filters.Bought(account);
    const events = await readSaleContract.queryFilter(filter);
    const bonusSum = events.reduce((acc, ev) => acc + BigInt(ev.args.bonusIBITI), 0n);

    rewardEl.innerText = Number(ethers.formatUnits(bonusSum, 8)).toFixed(2);
    statsBlock.style.display = "block";
  } catch (err) {
    console.warn("Ошибка загрузки статистики рефералов/бонусов:", err);
  }
}

window.openPurchaseModal = async function(productName) {
  if (!selectedAccount) {
    try { await connectWallet(); }
    catch (err) { return console.warn("Ошибка подключения кошелька:", err); }
  }
  if (productName === "NFT") {
    window.location.href = "nft.html";
    return;
  }
  document.getElementById("purchaseTitle").innerText = "Покупка " + productName;
  document.getElementById("purchaseModal").style.display = "block";
};

window.closePurchaseModal = function() {
  document.getElementById("purchaseModal").style.display = "none";
  document.getElementById("nftAmount").value = "";
};

async function handlePurchase(amount, productName) {
  if (!window.ethereum) return Swal.fire({ icon: "warning", title: "MetaMask не найден", text: "Установите MetaMask." });

  Swal.fire({ title: "Ожидание подтверждения...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });

  try {
    const decimals = 8;
    const amountFormatted = ethers.parseUnits(amount.toString(), decimals);
    const paymentMethod = document.getElementById("paymentToken")?.value;
    if (productName !== "IBITIcoin" || paymentMethod !== "USDT") throw new Error("Оплата через BNB временно отключена.");

    const usdt = new ethers.Contract(config.active.contracts.USDT_TOKEN, ibitiTokenAbi, signer);
    const usdtBalance = await usdt.balanceOf(selectedAccount);
    if (usdtBalance < amountFormatted) throw new Error("Недостаточно USDT.");

    const referrer = localStorage.getItem("referrer") || ethers.ZeroAddress;
    const tx = await buyIBITI(amountFormatted, referrer);
    await tx.wait();
    await showIbitiBalance(true);

    if (Number(amount) >= 10) {
      localStorage.setItem(`referralUnlocked_${selectedAccount}`, "1");
      await loadReferralStats(selectedAccount);
      const refLink = `${window.location.origin}${window.location.pathname}?ref=${selectedAccount}`;
      await Swal.fire({
        icon: "info", title: "Реферальная ссылка", html: `<a href="${refLink}" target="_blank">${refLink}</a>`,
        confirmButtonText: "Скопировать", preConfirm: () => navigator.clipboard.writeText(refLink)
      });
      window.enableReferralAfterPurchase?.(selectedAccount);
    }

    Swal.fire({ icon: "success", title: "Покупка успешна!", timer: 3000, showConfirmButton: false });
  } catch (error) {
    const reason = error?.message?.replace(/^Error:\s*/, "") || "Неизвестная ошибка";
    Swal.fire({ icon: "error", title: "Ошибка", text: reason, confirmButtonText: "Ок" });
    console.warn("Ошибка при покупке:", error);
  }
}

window.handlePurchase = handlePurchase;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && ethers.isAddress(ref)) localStorage.setItem("referrer", ref);

  loadSaleStats();
  loadReferralData();
  setInterval(loadSaleStats, 30000);

  document.getElementById("refreshStats")?.addEventListener("click", loadSaleStats);
  document.getElementById("purchaseForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const amount = document.getElementById("nftAmount").value;
    closePurchaseModal();
    await handlePurchase(amount, currentProduct);
    loadSaleStats();
  });
});

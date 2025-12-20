import config from "./config.js";

const $ = (id) => document.getElementById(id);

function setText(id, v) { const el = $(id); if (el) el.textContent = v; }

function setDash(msg="Updated: —") {
  ["cap","refReserve","salePool","sold","left","bonusPool","soldPercent"].forEach(id => setText(id, "—"));
  const bar = $("salesProgress"); if (bar) bar.style.width = "0%";
  setText("lastUpdated", msg);
}

function fmt(n, dec) {
  // ethers уже подключён у тебя как UMD
  return ethers.formatUnits(n, dec);
}

async function getNetCfg() {
  // если есть кошелёк — берём chainId, иначе active
  if (window.ethereum) {
    const p = new ethers.BrowserProvider(window.ethereum);
    const net = await p.getNetwork();
    const cid = Number(net.chainId);
    if (cid === config.testnet.chainId) return config.testnet;
    if (cid === config.mainnet.chainId) return config.mainnet;
  }
  return config.active;
}

async function loadPromoStats() {
  try {
    const netCfg = await getNetCfg();
    const router = netCfg.contracts.REFERRAL_SWAP_ROUTER || "";
    const ibiti = netCfg.contracts.IBITI_TOKEN;

    if (!router) {
      setDash("Updated: promo not deployed");
      return;
    }

    // только RPC — никаких BrowserProvider логов
    const provider = new ethers.JsonRpcProvider(netCfg.rpcUrl);

    const ABI = [
      "function getPromoStats() view returns (uint256 buys,uint256 usdtIn,uint256 ibitiToBuyers,uint256 bonusPaid,uint256 refPaid,uint256 ibitiOnContract,uint256 ibitiWithdrawn,uint256 usdtWithdrawn)"
    ];

    const c = new ethers.Contract(router, ABI, provider);
    const s = await c.getPromoStats();

    const buys = s.buys;
    const usdtIn = s.usdtIn;
    const ibitiToBuyers = s.ibitiToBuyers;
    const bonusPaid = s.bonusPaid;
    const refPaid = s.refPaid;
    const left = s.ibitiOnContract;
    const ibitiWithdrawn = s.ibitiWithdrawn;

    // “cap” (всего прошло через контракт) = осталось + выдано покупателям + реф + выведено владельцем
    const cap = left + ibitiToBuyers + refPaid + ibitiWithdrawn;

    const sold = ibitiToBuyers + refPaid; // сколько ушло с контракта людям
    const soldPct = cap > 0n ? Number((sold * 10000n) / cap) / 100 : 0;

    setText("cap", fmt(cap, 8));
    setText("refReserve", fmt(refPaid, 8));
    setText("salePool", "0");
    setText("sold", fmt(sold, 8));
    setText("left", fmt(left, 8));
    setText("bonusPool", fmt(bonusPaid, 8));
    setText("soldPercent", soldPct.toFixed(2) + "%");

    const bar = $("salesProgress");
    if (bar) bar.style.width = Math.min(100, soldPct) + "%";

    setText("lastUpdated", "Updated: " + new Date().toLocaleString());
  } catch (e) {
    console.error(e);
    setDash("Updated: error");
  }
}

setDash("Updated: click Refresh");

const btn = document.getElementById("refreshStats");
if (btn) btn.addEventListener("click", loadPromoStats);

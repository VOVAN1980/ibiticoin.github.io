(function () {
  const $ = (id) => document.getElementById(id);

  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  const REFERRAL_SWAP_ABI = [
    "event BoughtWithBonus(address indexed buyer,uint256 usdtIn,uint256 ibitiOut,uint256 bonus,address indexed referrer,uint256 refReward)",
    "event WithdrawIBITI(address indexed to,uint256 amount)"
  ];

  function setDash(message = "Updated: —") {
    ["cap","refReserve","salePool","sold","left","bonusPool","soldPercent"].forEach(id => $(id) && ($(id).textContent = "—"));
    if ($("salesProgress")) $("salesProgress").style.width = "0%";
    if ($("lastUpdated")) $("lastUpdated").textContent = message;
  }

  async function getProvider() {
    if (window.ethereum) return new ethers.BrowserProvider(window.ethereum);
    // fallback RPC (testnet by default)
    return new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
  }

  async function getCfg(provider) {
    const net = await provider.getNetwork();
    const chainId = Number(net.chainId);

    // 1) если есть config.active — берём оттуда (это твой главный источник)
    if (window.config && window.config.active && window.config.active.contracts) {
      const c = window.config.active;
      const router = c.contracts.REFERRAL_SWAP_ROUTER || "";
      return {
        chainId,
        ibiti: c.contracts.IBITI_TOKEN,
        usdt:  c.contracts.USDT_TOKEN,
        router,
        fromBlock: 0
      };
    }

    // 2) иначе пробуем PROMO_STATS
    const ps = window.PROMO_STATS?.[chainId];
    if (!ps) return { chainId, ibiti: "", usdt: "", router: "", fromBlock: 0 };

    return { chainId, ...ps };
  }

  async function getLogsChunked(provider, filter, step = 5000) {
    const latest = await provider.getBlockNumber();
    let from = Number(filter.fromBlock ?? 0);
    let to = Number(filter.toBlock ?? latest);
    if (from < 0) from = 0;
    if (to > latest) to = latest;

    const out = [];
    for (let start = from; start <= to; start += step + 1) {
      const end = Math.min(start + step, to);
      const part = await provider.getLogs({ ...filter, fromBlock: start, toBlock: end });
      out.push(...part);
    }
    return out;
  }

  async function loadPromoStats() {
    try {
      if (typeof ethers === "undefined") {
        setDash("Updated: ethers missing");
        return;
      }

      const provider = await getProvider();
      const cfg = await getCfg(provider);

      if (!cfg.ibiti || !cfg.router) {
        setDash("Updated: promo not deployed");
        return;
      }

      const ibiti = new ethers.Contract(cfg.ibiti, ERC20_ABI, provider);
      const dec = await ibiti.decimals();
      if (Number(dec) !== 8) console.warn("IBITI decimals != 8, got:", dec);

      const routerBal = await ibiti.balanceOf(cfg.router);

      const iface = new ethers.Interface(REFERRAL_SWAP_ABI);
      const topicBought = iface.getEvent("BoughtWithBonus").topicHash;
      const topicWdr    = iface.getEvent("WithdrawIBITI").topicHash;

      const fromBlock = Number(cfg.fromBlock || 0);

      const boughtLogs = await getLogsChunked(provider, { address: cfg.router, topics: [topicBought], fromBlock });
      const wdrLogs    = await getLogsChunked(provider, { address: cfg.router, topics: [topicWdr], fromBlock });

      let totalBonus = 0n, totalRef = 0n, totalWdr = 0n;

      for (const l of boughtLogs) {
        const p = iface.parseLog(l);
        totalBonus += BigInt(p.args.bonus);
        totalRef   += BigInt(p.args.refReward);
      }
      for (const l of wdrLogs) {
        const p = iface.parseLog(l);
        totalWdr += BigInt(p.args.amount);
      }

      const spent = totalBonus + totalRef;
      const cap   = routerBal + spent + totalWdr;
      const soldPct = cap > 0n ? Number((spent * 10000n) / cap) / 100 : 0;

      const fmt8 = (x) => ethers.formatUnits(x, 8);

      if ($("cap"))        $("cap").textContent        = fmt8(cap);
      if ($("refReserve")) $("refReserve").textContent = fmt8(totalRef);
      if ($("salePool"))   $("salePool").textContent   = "0";
      if ($("sold"))       $("sold").textContent       = fmt8(spent);
      if ($("left"))       $("left").textContent       = fmt8(routerBal);
      if ($("bonusPool"))  $("bonusPool").textContent  = fmt8(totalBonus);

      if ($("soldPercent")) $("soldPercent").textContent = soldPct.toFixed(2) + "%";
      if ($("salesProgress")) $("salesProgress").style.width = Math.min(100, soldPct) + "%";
      if ($("lastUpdated")) $("lastUpdated").textContent = "Updated: " + new Date().toLocaleString();

    } catch (e) {
      console.error(e);
      setDash("Updated: error");
    }
  }

  // auto-load + refresh button
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadPromoStats);
  } else {
    loadPromoStats();
  }

  const btn = document.getElementById("refreshStats");
  if (btn) btn.addEventListener("click", loadPromoStats);
})();

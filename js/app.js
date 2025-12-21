/* IBITIcoin Shop App (classic script, uses ethers UMD) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const isAddr = (a) => typeof a === "string" && /^0x[a-fA-F0-9]{40}$/.test(a);

  const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)"
  ];

  // PromoRouter ABI (only what we use)
  const PROMO_ABI = [
    "function promoActive() view returns (bool)",
    "function promoEndTime() view returns (uint256)",
    "function bonusBps() view returns (uint256)",
    "function minPaymentAmount() view returns (uint256)",
    "function getStats() view returns (uint256 bonusPoolTotal, uint256 bonusSpent, uint256 refSpent)",
    "function poolRemaining() view returns (uint256)",
    "function buyWithReferral(uint256 usdtAmount, address referrer) external"
  ];

  function net() {
    return window.IBITI_CONFIG.getNet();
  }

  function setNetBadge() {
    const badge = $("netBadge");
    if (!badge) return;
    if (net().key === "testnet") {
      badge.textContent = "TESTNET MODE";
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }

  function fmt(n, decimals = 8, maxFrac = 8) {
    const f = Number(ethers.formatUnits(n, decimals));
    if (!Number.isFinite(f)) return "—";
    // trim noisy tails
    return f.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
  }

  function nowStr() {
    const d = new Date();
    const pad = (x) => String(x).padStart(2, "0");
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function currentRefParam() {
    const url = new URL(window.location.href);
    const r = (url.searchParams.get("ref") || "").trim();
    return isAddr(r) ? r : null;
  }

  function buildMyReferralLink(addr) {
    const url = new URL(window.location.href);
    url.searchParams.set("ref", addr);
    // keep current net param if testnet
    if (net().key === "testnet") url.searchParams.set("net", "testnet");
    else url.searchParams.delete("net");
    return url.toString();
  }

  function toast(msg) {
    const el = $("toast");
    if (!el) return alert(msg);
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2400);
  }

  function getReadProvider() {
    const rpc = net().rpcUrls && net().rpcUrls[0] ? net().rpcUrls[0] : null;
    if (!rpc) throw new Error("RPC not set in config for this network.");
    return new ethers.JsonRpcProvider(rpc);
  }

  async function ensureChain() {
    if (!window.ethereum) throw new Error("No wallet detected (MetaMask/Trust Wallet/Binance Wallet).");
    const target = net();
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId && chainId.toLowerCase() === target.chainIdHex.toLowerCase()) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: target.chainIdHex }]
      });
    } catch (e) {
      // 4902: chain not added
      if (e && (e.code === 4902 || String(e.message || "").includes("4902"))) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: target.chainIdHex,
            chainName: target.chainName,
            rpcUrls: target.rpcUrls,
            nativeCurrency: target.nativeCurrency,
            blockExplorerUrls: target.blockExplorerUrls
          }]
        });
      } else {
        throw e;
      }
    }
  }

  async function getBrowserProviderSigner() {
    await ensureChain();
    const bp = new ethers.BrowserProvider(window.ethereum);
    const signer = await bp.getSigner();
    return { bp, signer };
  }

  async function connectWallet() {
    await ensureChain();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const addr = accounts && accounts[0] ? accounts[0] : null;
    if (!addr) throw new Error("No account returned by wallet.");

    const addrEl = $("walletAddress");
    if (addrEl) addrEl.textContent = addr;

    // show balance
    const { signer } = await getBrowserProviderSigner();
    const token = new ethers.Contract(net().ibiti, ERC20_ABI, signer);
    const dec = await token.decimals();
    const bal = await token.balanceOf(addr);
    const balEl = $("ibitiBalance");
    if (balEl) balEl.textContent = `${fmt(bal, dec, 8)} IBITI`;

    // referral link field
    const linkEl = $("referralLink");
    if (linkEl) linkEl.value = buildMyReferralLink(addr);

    toast("Wallet connected.");
  }

  async function addTokenToWallet() {
    if (!window.ethereum) throw new Error("No wallet detected.");
    const tokenAddress = net().ibiti;
    const tokenSymbol = "IBITI";
    const tokenDecimals = 8;
    const tokenImage = "https://ibiticoin.com/img/IBITI-512.png";

    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImage
        }
      }
    });

    toast("Token request sent to wallet.");
  }

  function updateProgress(percent) {
    const bar = $("salesProgress");
    const p = $("soldPercent");
    if (p) p.textContent = Number.isFinite(percent) ? `${percent.toFixed(2)}%` : "—";
    if (bar) {
      const w = Math.max(0, Math.min(100, percent || 0));
      bar.style.width = `${w}%`;
    }
  }

  async function refreshStats() {
    setNetBadge();

    const netCfg = net();
    const setText = (id, t) => { const el = $(id); if (el) el.textContent = t; };

    if (!netCfg.promoRouter || !isAddr(netCfg.promoRouter)) {
      setText("statTotal", "—");
      setText("statSpent", "—");
      setText("statRemaining", "—");
      setText("statBonusPool", "—");
      setText("routerAddr", "(promo router not set)");
      setText("lastUpdated", "Promo router is not set for this network yet.");
      updateProgress(NaN);
      return;
    }

    const rp = getReadProvider();
    const promo = new ethers.Contract(netCfg.promoRouter, PROMO_ABI, rp);
    const ibiti = new ethers.Contract(netCfg.ibiti, ERC20_ABI, rp);

    const ibitiDec = await ibiti.decimals();
    const routerBal = await ibiti.balanceOf(netCfg.promoRouter);

    const stats = await promo.getStats();
    const bonusPoolTotal = stats[0];
    const bonusSpent = stats[1];
    const refSpent = stats[2];
    const spentTotal = bonusSpent + refSpent;

    let remaining;
    try {
      remaining = await promo.poolRemaining();
    } catch {
      remaining = routerBal;
    }

    // progress = spent / bonusPoolTotal (safe bigint math)
    let pct = NaN;
    if (bonusPoolTotal > 0n) {
      const pct100 = (spentTotal * 10000n) / bonusPoolTotal; // 2 decimals
      pct = Number(pct100) / 100;
    }
    updateProgress(pct);

    setText("statTotal", `${fmt(routerBal, ibitiDec, 8)} IBITI`);
    setText("statSpent", `${fmt(spentTotal, ibitiDec, 8)} IBITI`);
    setText("statRemaining", `${fmt(remaining, ibitiDec, 8)} IBITI`);
    setText("statBonusPool", `${fmt(bonusPoolTotal, ibitiDec, 8)} IBITI`);

    setText("routerAddr", netCfg.promoRouter);
    setText("lastUpdated", `Updated: ${nowStr()}`);

    // promo info line
    const active = await promo.promoActive();
    const bonusBps = await promo.bonusBps();
    const minPay = await promo.minPaymentAmount();
    const usdt = new ethers.Contract(netCfg.usdt, ERC20_ABI, rp);
    const usdtDec = await usdt.decimals();

    const infoEl = $("minPayInfo");
    if (infoEl) {
      infoEl.textContent = `Min: ${fmt(minPay, usdtDec, 2)} USDT · Bonus: ${(Number(bonusBps) / 100).toFixed(2)}% · Active: ${active}`;
    }
  }

  async function buyPromo() {
    const netCfg = net();
    if (!netCfg.promoRouter || !isAddr(netCfg.promoRouter)) {
      throw new Error("Promo router not set on this network.");
    }

    const amtEl = $("promoUsdtAmount");
    const amtStr = amtEl ? String(amtEl.value || "").trim() : "";
    const amtNum = Number(amtStr);
    if (!Number.isFinite(amtNum) || amtNum <= 0) throw new Error("Invalid USDT amount.");
    if (amtNum < 10) throw new Error("Minimum is 10 USDT.");

    const ref = currentRefParam();
    const { signer } = await getBrowserProviderSigner();

    const usdt = new ethers.Contract(netCfg.usdt, ERC20_ABI, signer);
    const usdtDec = await usdt.decimals();
    const amount = ethers.parseUnits(String(amtNum), usdtDec);

    // approve
    toast("Approve USDT…");
    const txA = await usdt.approve(netCfg.promoRouter, amount);
    await txA.wait();

    // buy
    const promo = new ethers.Contract(netCfg.promoRouter, PROMO_ABI, signer);
    toast("Buying with +10% bonus…");
    const txB = await promo.buyWithReferral(amount, ref ? ref : ethers.ZeroAddress);
    await txB.wait();

    toast("Done!");
    await connectWallet().catch(() => {});
    await refreshStats().catch(() => {});
  }

  // ===== Regular buy (no bonus): PancakeSwap modal =====
  function openPancakeModal() {
    const modal = $("pancakeModal");
    const link = $("pancakeOpenLink");
    const url = net().pancakeSwapUrl;
    if (link) link.href = url;
    if (modal) modal.classList.add("open");
  }

  function closePancakeModal() {
    const modal = $("pancakeModal");
    if (modal) modal.classList.remove("open");
  }

  function goNftGallery() {
    const url = net().nftGalleryUrl || "nft.html";
    window.location.href = url;
  }

  async function copyMyLink() {
    const input = $("referralLink");
    const v = input ? String(input.value || "") : "";
    if (!v) return toast("Referral link is empty.");
    await navigator.clipboard.writeText(v);
    toast("Copied.");
  }

  function shareLink() {
    const input = $("referralLink");
    const v = input ? String(input.value || "") : "";
    if (!v) return toast("Referral link is empty.");
    if (navigator.share) {
      navigator.share({ title: "IBITI Referral Link", url: v }).catch(() => {});
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(v)}`, "_blank");
    }
  }

  function wire() {
    setNetBadge();

    const btnConnect = $("connectWalletBtn");
    if (btnConnect) btnConnect.addEventListener("click", () => connectWallet().catch(e => { console.error(e); toast("Connect failed."); }));

    const btnAdd = $("addTokenBtn");
    if (btnAdd) btnAdd.addEventListener("click", () => addTokenToWallet().catch(e => { console.error(e); toast("Add token failed."); }));

    const btnBuy = $("promoBuyButton");
    if (btnBuy) btnBuy.addEventListener("click", () => buyPromo().catch(e => { console.error(e); toast(e?.shortMessage || e?.message || "Buy failed."); }));

    const btnRefresh = $("refreshStatsBtn");
    if (btnRefresh) btnRefresh.addEventListener("click", () => refreshStats().catch(e => { console.error(e); toast("Refresh failed."); }));

    const copyBtn = $("copyMyReferralLink");
    if (copyBtn) copyBtn.addEventListener("click", () => copyMyLink().catch(e => { console.error(e); toast("Copy failed."); }));

    const shareBtn = $("shareReferralLink");
    if (shareBtn) shareBtn.addEventListener("click", shareLink);

    const buyPancake = $("buyPancakeBtn");
    if (buyPancake) buyPancake.addEventListener("click", openPancakeModal);

    const nftBtn = $("buyNftBtn");
    if (nftBtn) nftBtn.addEventListener("click", goNftGallery);

    const closeBtn = $("pancakeCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closePancakeModal);

    const cancelBtn = $("pancakeCancelBtn");
    if (cancelBtn) cancelBtn.addEventListener("click", closePancakeModal);

    const overlay = $("pancakeOverlay");
    if (overlay) overlay.addEventListener("click", closePancakeModal);

    // Init referral link if wallet already connected
    window.ethereum?.request({ method: "eth_accounts" })
      .then((accs) => {
        if (accs && accs[0] && $("referralLink")) $("referralLink").value = buildMyReferralLink(accs[0]);
      })
      .catch(() => {});

    refreshStats().catch(() => {});
  }

  document.addEventListener("DOMContentLoaded", wire);

  window.IBITI_APP = {
    connectWallet,
    refreshStats,
    buyPromo,
    openPancakeModal
  };
})();

/* IBITIcoin Shop App (classic script, uses ethers UMD) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const isAddr = (a) => typeof a === "string" && /^0x[a-fA-F0-9]{40}$/.test(a);

  const LS_PREFIX = "ibiti_promo_purchased_v1";
  function lsKey(chainIdDec, account){ return `${LS_PREFIX}:${chainIdDec}:${String(account||"").toLowerCase()}`; }

  function setReferralUnlocked(unlocked) {
    const locked = $("refLocked");
    const unlockedBox = $("refUnlocked");
    if (locked) locked.classList.toggle("hidden", !!unlocked);
    if (unlockedBox) unlockedBox.classList.toggle("hidden", !unlocked);
  }

  async function hasConnectedAccount() {
    if (!window.ethereum) return false;
    const accs = await window.ethereum.request({ method: "eth_accounts" });
    return !!(accs && accs[0]);
  }

  async function currentAccount() {
    if (!window.ethereum) return null;
    const accs = await window.ethereum.request({ method: "eth_accounts" });
    return accs && accs[0] ? accs[0] : null;
  }

  async function checkPurchasedOnchain(account) {
    const netCfg = net();
    if (!netCfg.promoRouter || !isAddr(netCfg.promoRouter) || !account) return false;
    const rp = getReadProvider();
    const iface = new ethers.Interface([
      "event PromoBuy(address indexed buyer, address indexed referrer, uint256 paymentAmount, uint256 boughtAmount, uint256 bonusAmount, uint256 refAmount)"
    ]);
    const topic0 = iface.getEvent("PromoBuy").topicHash;
    const topic1 = ethers.zeroPadValue(account, 32);
    const toBlock = await rp.getBlockNumber();
    const scan = Number(netCfg.logScanBlocks || 200000);
    const fromBlock = Math.max(0, toBlock - scan);
    const logs = await rp.getLogs({
      address: netCfg.promoRouter,
      fromBlock,
      toBlock,
      topics: [topic0, topic1]
    });
    return Array.isArray(logs) && logs.length > 0;
  }

  async function updateReferralUI(account) {
    const netCfg = net();
    const input = $("referralLink");
    const copyBtn = $("copyMyReferralLink");
    const shareBtn = $("shareReferralLink");

    // Default: locked
    setReferralUnlocked(false);
    if (input) input.value = "";

    if (!account) return;

    // LocalStorage first
    let purchased = false;
    try {
      purchased = localStorage.getItem(lsKey(netCfg.chainIdDec, account)) === "1";
    } catch (_) {}

    // If not in LS, check chain logs (for users who bought earlier)
    if (!purchased) {
      try {
        purchased = await checkPurchasedOnchain(account);
        if (purchased) {
          try { localStorage.setItem(lsKey(netCfg.chainIdDec, account), "1"); } catch (_) {}
        }
      } catch (_) {}
    }

    if (purchased) {
      setReferralUnlocked(true);
      if (input) input.value = buildMyReferralLink(account);
      if (copyBtn) copyBtn.disabled = false;
      if (shareBtn) shareBtn.disabled = false;
    } else {
      if (copyBtn) copyBtn.disabled = true;
      if (shareBtn) shareBtn.disabled = true;
    }
  }

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

  // ===== Mobile browsers without injected wallet =====
  function isMobileUA() {
    const ua = navigator.userAgent || "";
    return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  }

  function gotoWalletChooser() {
    // Opens wallet.html (same folder) and preserves current query (?net=...&ref=...)
    try {
      const cur = new URL(location.href);
      const currentPage = (cur.pathname.split("/").pop() || "shop.html");
      cur.pathname = cur.pathname.replace(/[^/]*$/, "wallet.html");
      if (!cur.searchParams.get("to")) cur.searchParams.set("to", currentPage);
      location.href = cur.toString();
    } catch (e) {
      location.href = "wallet.html";
    }
  }



  async function connectWallet() {
    if (!window.ethereum || !window.ethereum.request) {
      if (isMobileUA()) {
        gotoWalletChooser();
        return null;
      }
      throw new Error("No injected wallet found. Install MetaMask or open this site inside a wallet browser.");
    }
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

    // referral link field (unlocks after first promo buy)
    await updateReferralUI(addr);

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

    // mark referral unlocked (after first successful promo purchase)
    try {
      const acc = await currentAccount();
      if (acc) localStorage.setItem(lsKey(net().chainIdDec, acc), "1");
      await updateReferralUI(acc);
    } catch (_) {}

    toast("Done!");
    await connectWallet().catch(() => {});
    await refreshStats().catch(() => {});
  }

    // ===== Regular buy (no bonus): PancakeSwap modal =====
  async function openPancakeModal() {
    // user requirement: show connect wallet prompt first
    if (!(await hasConnectedAccount())) {
      toast("Please connect your wallet first.");
      await connectWallet();
    }

    const modal = $("pancakeModal");
    const overlay = $("pancakeOverlay");
    const link = $("pancakeOpenLink");
    const url = net().pancakeSwapUrl;
    if (link) link.href = url;
    if (overlay) overlay.classList.add("open");
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
    if (!v) return toast("Referral link is not available yet. Make your first promo purchase (>= $10) to unlock it.");
    await navigator.clipboard.writeText(v);
    toast("Copied!");
  }

    function openShareModal() {
    const overlay = $("shareOverlay");
    const modal = $("shareModal");
    if (overlay) overlay.classList.remove("hidden");
    if (modal) modal.classList.remove("hidden");
  }
  function closeShareModal() {
    const overlay = $("shareOverlay");
    const modal = $("shareModal");
    if (overlay) overlay.classList.add("hidden");
    if (modal) modal.classList.add("hidden");
  }

  async function shareLink() {
    const input = $("referralLink");
    const v = input ? String(input.value || "") : "";
    if (!v) return toast("Referral link is not available yet. Make your first promo purchase (>= $10) to unlock it.");

    // Native share sheet (mobile) if available
    if (navigator.share) {
      try {
        await navigator.share({ title: "IBITI Referral Link", url: v });
        return;
      } catch (_) {}
    }

    // Desktop fallback: our own chooser modal
    openShareModal();
  }

  function wire() {
    setNetBadge();
    setReferralUnlocked(false);

    const btnConnect = $("connectWalletBtn");
    if (btnConnect) btnConnect.addEventListener("click", () => connectWallet().catch(e => { console.error(e); toast("Connect failed."); }));

    const btnAdd = $("addTokenBtn");
    if (btnAdd) btnAdd.addEventListener("click", () => addTokenToWallet().catch(e => { console.error(e); toast("Add token failed."); }));

    const btnBuy = $("promoBuyButton");
    if (btnBuy) btnBuy.addEventListener("click", async () => {
      if (!(await hasConnectedAccount())) {
        toast("Please connect your wallet first.");
        await connectWallet();
      }
      return buyPromo().catch(e => { console.error(e); toast(e?.shortMessage || e?.message || "Buy failed."); });
    });

    const btnRefresh = $("refreshStatsBtn");
    if (btnRefresh) btnRefresh.addEventListener("click", () => refreshStats().catch(e => { console.error(e); toast("Refresh failed."); }));

    const copyBtn = $("copyMyReferralLink");
    if (copyBtn) copyBtn.addEventListener("click", () => copyMyLink().catch(e => { console.error(e); toast("Copy failed."); }));

    const shareBtn = $("shareReferralLink");
    if (shareBtn) shareBtn.addEventListener("click", shareLink);

    // Share modal wiring
    const shOv = $("shareOverlay");
    const shCancel = $("shareCancelBtn");
    if (shOv) shOv.addEventListener("click", closeShareModal);
    if (shCancel) shCancel.addEventListener("click", closeShareModal);

    const shCopy = $("shareCopyBtn");
    const shTg = $("shareTgBtn");
    const shX = $("shareXBtn");
    const shFb = $("shareFbBtn");

    const getRefValue = () => {
      const input = $("referralLink");
      return input ? String(input.value || "") : "";
    };

    if (shCopy) shCopy.addEventListener("click", async () => {
      const v = getRefValue();
      if (!v) return toast("Referral link is empty.");
      await navigator.clipboard.writeText(v);
      toast("Copied!");
      closeShareModal();
    });

    if (shTg) shTg.addEventListener("click", () => {
      const v = getRefValue();
      if (!v) return toast("Referral link is empty.");
      window.open(`https://t.me/share/url?url=${encodeURIComponent(v)}`, "_blank");
      closeShareModal();
    });

    if (shX) shX.addEventListener("click", () => {
      const v = getRefValue();
      if (!v) return toast("Referral link is empty.");
      const text = "IBITI promo: +10% bonus with my referral link";
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(v)}&text=${encodeURIComponent(text)}`, "_blank");
      closeShareModal();
    });

    if (shFb) shFb.addEventListener("click", () => {
      const v = getRefValue();
      if (!v) return toast("Referral link is empty.");
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(v)}`, "_blank");
      closeShareModal();
    });


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
        if (accs && accs[0]) updateReferralUI(accs[0]).catch(() => {});
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

/* IBITIcoin Shop App (classic script, uses ethers UMD) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const isAddr = (a) => typeof a === "string" && /^0x[a-fA-F0-9]{40}$/.test(a);

  // ===== toast (NO alerts; auto-create element if missing) =====
  function ensureToastEl() {
    let el = $("toast");
    if (el) return el;

    el = document.createElement("div");
    el.id = "toast";
    el.style.cssText =
      "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);" +
      "z-index:1000000;background:rgba(0,0,0,0.86);color:#fff;" +
      "padding:10px 14px;border-radius:12px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;" +
      "font-weight:700;font-size:13px;max-width:min(92vw,520px);" +
      "text-align:center;box-shadow:0 12px 40px rgba(0,0,0,0.35);" +
      "opacity:0;pointer-events:none;transition:opacity .18s ease;";
    document.body.appendChild(el);
    return el;
  }

  let toastTimer = null;
  function toast(msg, ms = 2200) {
    const el = ensureToastEl();
    el.textContent = String(msg || "");
    el.style.opacity = "1";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.opacity = "0"; }, ms);
  }

  // ===== referral unlock storage =====
  const LS_PREFIX = "ibiti_promo_purchased_v1";
  function lsKey(chainIdDec, account) {
    return `${LS_PREFIX}:${chainIdDec}:${String(account || "").toLowerCase()}`;
  }

  function setReferralUnlocked(unlocked) {
    const locked = $("refLocked");
    const unlockedBox = $("refUnlocked");
    if (locked) locked.classList.toggle("hidden", !!unlocked);
    if (unlockedBox) unlockedBox.classList.toggle("hidden", !unlocked);
  }

  function setPurchaseEnabled(enabled) {
    const ids = ["promoBuyButton", "buyPancakeBtn", "buyNftBtn"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.disabled = !enabled;
      el.classList.toggle("btn-disabled", !enabled);
      el.title = enabled ? "" : "Connect wallet first";
    });
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

  // ===== ABI =====
  const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
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
    "function swapPath(uint256) view returns (address)",
    "function buyWithReferral(uint256 paymentAmount, address referrer, uint256 minIbitiOut) external"
  ];

  // Pancake/Uniswap v2 router (quote only)
  const DEX_ROUTER_ABI = [
    "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)"
  ];

  function net() {
    return window.IBITI_CONFIG.getNet();
  }

  function setNetBadge() {
    const badge = $("netBadge");
    if (!badge) return;

    const k = net().key;
    badge.style.display = "inline-block";
    badge.textContent = (k === "testnet") ? "TESTNET MODE" : "MAINNET MODE";

    if (k === "testnet") {
      badge.style.color = "#8bd3ff";
      badge.style.borderColor = "rgba(139, 211, 255, 0.35)";
      badge.style.background = "rgba(0,0,0,0.55)";
    } else {
      badge.style.color = "#7CFFB2";
      badge.style.borderColor = "rgba(124, 255, 178, 0.35)";
      badge.style.background = "rgba(0,0,0,0.55)";
    }
  }

  function fmt(n, decimals = 8, maxFrac = 8) {
    const f = Number(ethers.formatUnits(n, decimals));
    if (!Number.isFinite(f)) return "—";
    return f.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
  }

  function nowStr() {
    const d = new Date();
    const pad = (x) => String(x).padStart(2, "0");
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // ===== referral capture (session) =====
  function currentRefParam() {
    const url = new URL(window.location.href);
    const r = (url.searchParams.get("ref") || "").trim();
    return isAddr(r) ? r : null;
  }

  const REF_KEY = "ibiti_referrer";
  function storeRef(ref) { try { if (ref && isAddr(ref)) sessionStorage.setItem(REF_KEY, ref); } catch (_) {} }
  function loadStoredRef() { try { const v = (sessionStorage.getItem(REF_KEY) || "").trim(); return isAddr(v) ? v : null; } catch (_) { return null; } }
  function captureIncomingRef() { const r = currentRefParam(); if (r) storeRef(r); }

  function getActiveReferrer(buyerAddr) {
    let ref = currentRefParam() || loadStoredRef();
    if (!ref) return null;
    if (buyerAddr && String(ref).toLowerCase() === String(buyerAddr).toLowerCase()) return null;
    return ref;
  }

  function buildMyReferralLink(addr) {
    const url = new URL(window.location.href);
    url.searchParams.set("ref", addr);
    if (net().key === "testnet") url.searchParams.set("net", "testnet");
    else url.searchParams.delete("net");
    return url.toString();
  }

  // ===== provider helpers =====
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

  // ===== on-chain purchase detect (logs) =====
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

    setReferralUnlocked(false);
    if (input) input.value = "";
    if (!account) return;

    let purchased = false;
    try { purchased = localStorage.getItem(lsKey(netCfg.chainIdDec, account)) === "1"; } catch (_) {}

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

  // ===== wallet connect =====
async function connectWallet() {
  // ✅ Mobile / no-injected-wallet path: отправляем в твой wallet.html
  if (!window.ethereum) {
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || "");
    if (isMobile) {
      const u = new URL("/wallet.html", location.origin); // НЕ переименовываем: wallet.html
      u.searchParams.set("redirect", location.href);      // вернёмся на эту же страницу/с параметрами
      location.href = u.toString();
      return;
    }
    throw new Error("No wallet detected. Open in MetaMask/Trust Wallet browser.");
  }

  // ✅ Normal path (desktop MetaMask / wallet in-app browser)
  await ensureChain();

  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const addr = accounts && accounts[0] ? accounts[0] : null;
  if (!addr) throw new Error("No account returned by wallet.");

  const addrEl = $("walletAddress");
  if (addrEl) addrEl.textContent = addr;

  const { signer } = await getBrowserProviderSigner();

  // token balance
  const token = new ethers.Contract(net().ibiti, ERC20_ABI, signer);

  let dec = 8;
  try { dec = await token.decimals(); } catch (_) {}

  const bal = await token.balanceOf(addr);

  const balEl = $("ibitiBalance");
  if (balEl) balEl.textContent = `${fmt(bal, dec, 8)} IBITI`;

  await updateReferralUI(addr);

  setPurchaseEnabled(true);
  toast("Wallet connected.");
}

async function addTokenToWallet() {
  // ✅ если не внутри кошелька — на мобиле перекинем в wallet.html
  if (!window.ethereum) {
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || "");
    if (isMobile) {
      const u = new URL("/wallet.html", location.origin);
      u.searchParams.set("redirect", location.href);
      location.href = u.toString();
      return;
    }
    throw new Error("No wallet detected. Open in MetaMask/Trust Wallet browser.");
  }

  await window.ethereum.request({
    method: "wallet_watchAsset",
    params: {
      type: "ERC20",
      options: {
        address: net().ibiti,
        symbol: "IBITI",
        decimals: 8,
        image: "https://ibiticoin.com/img/IBITI-512.png"
      }
    }
  });

  toast("Token request sent to wallet.");
}

  // ===== stats/progress =====
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
    try { remaining = await promo.poolRemaining(); }
    catch { remaining = routerBal; }

    let pct = NaN;
    if (bonusPoolTotal > 0n) {
      const pct100 = (spentTotal * 10000n) / bonusPoolTotal;
      pct = Number(pct100) / 100;
    }
    updateProgress(pct);

    setText("statTotal", `${fmt(routerBal, ibitiDec, 8)} IBITI`);
    setText("statSpent", `${fmt(spentTotal, ibitiDec, 8)} IBITI`);
    setText("statRemaining", `${fmt(remaining, ibitiDec, 8)} IBITI`);
    setText("statBonusPool", `${fmt(bonusPoolTotal, ibitiDec, 8)} IBITI`);

    setText("routerAddr", netCfg.promoRouter);
    setText("lastUpdated", `Updated: ${nowStr()}`);

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

  // ===== BUY PROMO =====
  async function buyPromo() {
    const netCfg = net();
    if (!netCfg.promoRouter || !isAddr(netCfg.promoRouter)) {
      throw new Error("Promo router not set on this network.");
    }

    const amtEl = $("promoUsdtAmount");
    const amtStr = amtEl ? String(amtEl.value || "").trim() : "";
    if (!/^\d+$/.test(amtStr)) throw new Error("Please enter a whole number (10–100).");

    const amtNum = parseInt(amtStr, 10);
    if (!Number.isFinite(amtNum) || amtNum <= 0) throw new Error("Invalid USDT amount.");
    if (amtNum < 10) throw new Error("Minimum is 10 USDT.");
    if (amtNum > 100) throw new Error("Maximum is 100 USDT.");

    const { signer } = await getBrowserProviderSigner();
    const buyerAddr = await signer.getAddress();
    const ref = getActiveReferrer(buyerAddr);

    const usdt = new ethers.Contract(netCfg.usdt, ERC20_ABI, signer);
    const usdtDec = await usdt.decimals();
    const amount = ethers.parseUnits(String(amtNum), usdtDec);

    // ✅ approve ONLY if needed (cuts confirmations)
    const needApprove = async () => {
      try {
        const cur = await usdt.allowance(buyerAddr, netCfg.promoRouter);
        return cur < amount;
      } catch (_) {
        return true;
      }
    };

    if (await needApprove()) {
      toast("Approve USDT…");
      const approveValue = netCfg.approveMax ? ethers.MaxUint256 : amount;
      const txA = await usdt.approve(netCfg.promoRouter, approveValue);
      await txA.wait();
    }

    const promo = new ethers.Contract(netCfg.promoRouter, PROMO_ABI, signer);

    // slippage protection (optional)
    let minOut = 0n;
    try {
      if (netCfg.pancakeRouter && isAddr(netCfg.pancakeRouter)) {
        const dex = new ethers.Contract(netCfg.pancakeRouter, DEX_ROUTER_ABI, signer);

        const path = [];
        for (let i = 0; i < 6; i++) {
          try { path.push(await promo.swapPath(i)); } catch (_) { break; }
        }

        if (path.length >= 2) {
          const amounts = await dex.getAmountsOut(amount, path);
          const boughtEst = amounts[amounts.length - 1];

          const slBps = Number(netCfg.slippageBps || 300); // 3% default
          const keepBps = BigInt(Math.max(0, 10000 - slBps));
          minOut = (boughtEst * keepBps) / 10000n;
        }
      }
    } catch (_) {
      minOut = 0n;
    }

    toast("Buying with +10% bonus…");
    const txB = await promo.buyWithReferral(
      amount,
      ref ? ref : ethers.ZeroAddress,
      minOut
    );

    toast("Waiting confirmation…");
    await txB.wait();

    // show receipt in modal (ONE screen)
    try {
      const netKey = (net().key === "testnet") ? "testnet" : "mainnet";
      const url =
        `/receipt.html?net=${encodeURIComponent(netKey)}` +
        `&tx=${encodeURIComponent(txB.hash)}` +
        `&buyer=${encodeURIComponent(buyerAddr)}` +
        `&paid=${encodeURIComponent(String(amtNum))}`;
      window.openReceiptModal && window.openReceiptModal(url);
    } catch (e) {
      console.warn("Show receipt failed:", e);
    }

    // mark referral unlocked
    try {
      const acc = await currentAccount();
      if (acc) localStorage.setItem(lsKey(net().chainIdDec, acc), "1");
      await updateReferralUI(acc);
    } catch (_) {}

    toast("Done!");
    // ❌ НЕ дергаем connectWallet() снова — это и давало лишние запросы/окна
    await refreshStats().catch(() => {});
  }

  // ===== Regular buy (Pancake modal) =====
  async function openPancakeModal() {
    if (!(await hasConnectedAccount())) {
      toast("Please connect your wallet first.");
      await connectWallet();
    }

    const modal = $("pancakeModal");
    const overlay = $("pancakeOverlay");
    const link = $("pancakeOpenLink");
    const url = "https://pancakeswap.finance/swap?chain=bsc&outputCurrency=0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb";

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

    if (navigator.share) {
      try {
        await navigator.share({ title: "IBITI Referral Link", url: v });
        return;
      } catch (_) {}
    }
    openShareModal();
  }

  function wire() {
    setNetBadge();
    captureIncomingRef();
    setPurchaseEnabled(false);
    setReferralUnlocked(false);

    const btnConnect = $("connectWalletBtn");
    if (btnConnect) btnConnect.addEventListener("click", () => {
      connectWallet().catch((e) => { console.error(e); toast("Connect failed."); });
    });

    const btnAdd = $("addTokenBtn");
    if (btnAdd) btnAdd.addEventListener("click", () => {
      addTokenToWallet().catch((e) => { console.error(e); toast("Add token failed."); });
    });

    const btnBuy = $("promoBuyButton");
    if (btnBuy) btnBuy.addEventListener("click", async () => {
      if (!(await hasConnectedAccount())) {
        toast("Please connect your wallet first.");
        try { await connectWallet(); } catch (e) { return; }
        if (!(await hasConnectedAccount())) return;
      }
      return buyPromo().catch((e) => {
        console.error(e);
        toast(e?.shortMessage || e?.message || "Buy failed.");
      });
    });

    const btnRefresh = $("refreshStatsBtn");
    if (btnRefresh) btnRefresh.addEventListener("click", () => {
      refreshStats().catch((e) => { console.error(e); toast("Refresh failed."); });
    });

    const copyBtn = $("copyMyReferralLink");
    if (copyBtn) copyBtn.addEventListener("click", () => {
      copyMyLink().catch((e) => { console.error(e); toast("Copy failed."); });
    });

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

    // Init UI if wallet already connected (NO popups)
    window.ethereum?.request({ method: "eth_accounts" })
      .then(async (accs) => {
        if (!accs || !accs[0]) return;
        const addr = accs[0];

        const addrEl = $("walletAddress");
        if (addrEl) addrEl.textContent = addr;

        setPurchaseEnabled(true);

        try {
          const { signer } = await getBrowserProviderSigner();
          const token = new ethers.Contract(net().ibiti, ERC20_ABI, signer);
          const dec = await token.decimals();
          const bal = await token.balanceOf(addr);
          const balEl = $("ibitiBalance");
          if (balEl) balEl.textContent = `${fmt(bal, dec, 8)} IBITI`;
        } catch (_) {}

        updateReferralUI(addr).catch(() => {});
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

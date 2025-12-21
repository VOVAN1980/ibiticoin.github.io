/* IBITIcoin Shop App (classic script, uses ethers UMD) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  function toast(msg) {
    const el = $("toast");
    const ok = $("toastOK");
    if (!el) return alert(msg);
    el.textContent = msg;
    el.style.opacity = "1";
    if (el._timer) clearTimeout(el._timer);
    el._timer = setTimeout(() => (el.style.opacity = "0"), 2600);
    if (ok) ok.style.display = "inline-block";
  }

  function fmt(n, d = 8, maxFrac = 8) {
    try {
      const x = Number(n);
      if (!isFinite(x)) return String(n);
      return x.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
    } catch {
      return String(n);
    }
  }

  function isAddr(a) {
    try { return ethers.isAddress(a); } catch { return false; }
  }

  function currentNet() {
    if (!window.IBITI_CONFIG) throw new Error("IBITI_CONFIG missing. Check js/config.js include order.");
    return window.IBITI_CONFIG.getNet();
  }

  async function hasEthereum() {
    return !!(window.ethereum && typeof window.ethereum.request === "function");
  }

  async function ensureChain(net) {
    const eth = window.ethereum;
    const current = await eth.request({ method: "eth_chainId" });
    if (current === net.chainIdHex) return;

    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: net.chainIdHex }] });
    } catch (e) {
      // 4902 = unknown chain
      if (e && e.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: net.chainIdHex,
            chainName: net.chainName,
            rpcUrls: net.rpcUrls,
            blockExplorerUrls: net.blockExplorerUrls,
            nativeCurrency: net.nativeCurrency
          }]
        });
      } else {
        throw e;
      }
    }
  }

  async function getProviderSigner() {
    if (!(await hasEthereum())) throw new Error("No wallet found (window.ethereum). Install MetaMask or use a Web3 wallet.");
    const net = currentNet();
    await ensureChain(net);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return { provider, signer, net };
  }

  function setNetBadge() {
    const net = currentNet();
    const badge = $("netBadge");
    if (!badge) return;

    if (net.key === "testnet") {
      badge.style.display = "block";
      badge.textContent = "TESTNET MODE";
    } else {
      badge.style.display = "none";
    }
  }

  function baseReferralUrl(addr) {
    const u = new URL(window.location.href);
    u.searchParams.set("ref", addr);
    // keep net=testnet if currently in testnet
    const mode = window.IBITI_CONFIG.detectMode();
    if (mode === "testnet") u.searchParams.set("net", "testnet");
    else u.searchParams.delete("net");
    return u.toString();
  }

  function getRefFromUrl() {
    const u = new URL(window.location.href);
    const ref = (u.searchParams.get("ref") || "").trim();
    return isAddr(ref) ? ref : ethers.ZeroAddress;
  }

  async function updateBalances(address) {
    const net = currentNet();
    const { provider } = await getProviderSigner();

    const erc20 = [
      "function decimals() view returns (uint8)",
      "function balanceOf(address) view returns (uint256)"
    ];

    const ibiti = new ethers.Contract(net.ibiti, erc20, provider);
    const dec = await ibiti.decimals();
    const bal = await ibiti.balanceOf(address);
    const human = ethers.formatUnits(bal, dec);

    const balEl = $("ibitiBalance");
    if (balEl) balEl.textContent = `IBITI balance: ${fmt(human, dec, 8)}`;
  }

  async function connectWallet() {
    const net = currentNet();
    setNetBadge();

    if (!(await hasEthereum())) {
      toast("Wallet not found. Install MetaMask or open in a Web3 wallet.");
      return;
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });

    const { signer } = await getProviderSigner();
    const addr = await signer.getAddress();

    const addrEl = $("walletAddress");
    if (addrEl) addrEl.textContent = addr;

    const ct = $("ctAddr");
    if (ct) ct.textContent = net.promoRouter ? net.promoRouter : "(promo router not set)";

    // referral link for user
    const linkInput = $("myReferralLink");
    if (linkInput) linkInput.value = baseReferralUrl(addr);

    await updateBalances(addr);

    // refresh stats after connect
    await refreshStats();
  }

  async function addTokenToWallet() {
    if (!(await hasEthereum())) return toast("Wallet not found.");
    const net = currentNet();

    try {
      await ensureChain(net);
      const tokenAddress = net.ibiti;

      // token meta (fixed)
      const tokenSymbol = "IBITI";
      const tokenDecimals = 8;
      const tokenImage = "https://www.ibiticoin.com/img/ibiti-coin.png";

      const ok = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: { address: tokenAddress, symbol: tokenSymbol, decimals: tokenDecimals, image: tokenImage }
        }
      });

      toast(ok ? "Token added to wallet." : "Token add cancelled.");
    } catch (e) {
      console.error(e);
      toast("Failed to add token. Check wallet permissions / network.");
    }
  }

  async function refreshStats() {
    const net = currentNet();
    setNetBadge();

    const setText = (id, text) => { const el = $(id); if (el) el.textContent = text; };

    // If promo router not set on mainnet yet — show placeholders
    if (!net.promoRouter || !isAddr(net.promoRouter)) {
      setText("soldPercent", "—");
      setText("sold", "— IBITI");
      setText("left", "— IBITI");
      setText("bonusPool", "— IBITI");
      setText("lastUpdated", "Promo router not set for this network.");
      return;
    }

    try {
      const { provider } = await getProviderSigner();

      const erc20 = [
        "function decimals() view returns (uint8)",
        "function balanceOf(address) view returns (uint256)"
      ];

      const promoAbi = [
        "function bonusBps() view returns (uint256)",
        "function minPaymentAmount() view returns (uint256)",
        "function getStats() view returns (uint256,uint256,uint256)",
        "function poolRemaining() view returns (uint256)",
        "function promoActive() view returns (bool)"
      ];

      const ibiti = new ethers.Contract(net.ibiti, erc20, provider);
      const usdt  = new ethers.Contract(net.usdt, erc20, provider);
      const promo = new ethers.Contract(net.promoRouter, promoAbi, provider);

      const ibitiDec = await ibiti.decimals();
      const usdtDec = await usdt.decimals();

      const [poolTotal, bonusSpent, refSpent] = await promo.getStats();
      const remaining = await promo.poolRemaining();
      const balOnContract = await ibiti.balanceOf(net.promoRouter);
      const bps = await promo.bonusBps();
      const minPay = await promo.minPaymentAmount();
      const active = await promo.promoActive();

      // UI fields
      setText("bonusPool", `${ethers.formatUnits(poolTotal, ibitiDec)} IBITI`);
      setText("sold", `${ethers.formatUnits(bonusSpent + refSpent, ibitiDec)} IBITI`);
      setText("left", `${ethers.formatUnits(remaining, ibitiDec)} IBITI`);

      const soldPct = poolTotal > 0n ? Number(((poolTotal - remaining) * 10000n) / poolTotal) / 100 : 0;
      setText("soldPercent", `${soldPct.toFixed(2)}%`);

      // show min payment and bonus
      const minEl = $("minPayInfo");
      if (minEl) minEl.textContent = `Min: ${ethers.formatUnits(minPay, usdtDec)} USDT • Bonus: ${(Number(bps)/100).toFixed(2)}% • Active: ${active}`;

      // contract balance (optional)
      const capEl = $("cap");
      if (capEl) capEl.textContent = `On contract: ${ethers.formatUnits(balOnContract, ibitiDec)} IBITI`;

      const time = new Date().toLocaleString();
      setText("lastUpdated", `Updated: ${time}`);
    } catch (e) {
      console.error(e);
      toast("Stats update failed. Check wallet connection and network.");
      const errEl = $("lastUpdated");
      if (errEl) errEl.textContent = "Error: cannot load promo stats.";
    }
  }

  async function buyPromo() {
    const net = currentNet();
    if (!net.promoRouter || !isAddr(net.promoRouter)) return toast("Promo router not set for this network.");

    const amountEl = $("promoUsdtAmount");
    const raw = amountEl ? String(amountEl.value || "").trim() : "";
    const n = Number(raw);

    if (!raw || !isFinite(n) || n <= 0) return toast("Enter USDT amount.");
    // min 10 enforced by contract; still pre-check to save gas
    if (n < 10) return toast("Minimum is 10 USDT.");

    const { signer, provider } = await getProviderSigner();

    const erc20 = [
      "function decimals() view returns (uint8)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)"
    ];

    const promoAbi = [
      "function buyWithReferral(uint256 paymentAmount, address referrer, uint256 minIbitiOut) external"
    ];

    const usdt = new ethers.Contract(net.usdt, erc20, signer);
    const promo = new ethers.Contract(net.promoRouter, promoAbi, signer);

    const usdtDec = await new ethers.Contract(net.usdt, ["function decimals() view returns (uint8)"], provider).decimals();
    const pay = ethers.parseUnits(String(Math.floor(n)), usdtDec);

    const ref = getRefFromUrl();

    // approve if needed
    const me = await signer.getAddress();
    const allowance = await usdt.allowance(me, net.promoRouter);
    if (allowance < pay) {
      toast("Approve USDT...");
      const txA = await usdt.approve(net.promoRouter, pay);
      await txA.wait();
    }

    toast("Buying IBITI (promo)...");
    const tx = await promo.buyWithReferral(pay, ref, 0);
    toast(`TX sent: ${tx.hash.slice(0, 10)}...`);
    await tx.wait();

    toast("✅ Purchase completed");
    await updateBalances(me);
    await refreshStats();

    // ensure referral link exists
    const linkInput = $("myReferralLink");
    if (linkInput && !linkInput.value) linkInput.value = baseReferralUrl(me);
  }

  function copyMyLink() {
    const input = $("myReferralLink");
    if (!input || !input.value) return toast("Referral link not ready. Connect wallet and buy at least once.");
    navigator.clipboard.writeText(input.value).then(
      () => toast("Referral link copied."),
      () => toast("Copy failed (browser permissions).")
    );
  }

  function shareMyLink() {
    const input = $("myReferralLink");
    const url = (input && input.value) ? input.value : window.location.href;
    if (navigator.share) {
      navigator.share({ title: "IBITIcoin Promo", url }).catch(() => {});
    } else {
      // fallback
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank");
    }
  }

  function wire() {
    setNetBadge();

    const btnConnect = $("connectWalletBtn");
    if (btnConnect) btnConnect.addEventListener("click", () => connectWallet().catch(e => { console.error(e); toast("Connect failed."); }));

    const btnAdd = $("addTokenBtn");
    if (btnAdd) btnAdd.addEventListener("click", () => addTokenToWallet());

    const btnBuy = $("promoBuyButton");
    if (btnBuy) btnBuy.addEventListener("click", () => buyPromo().catch(e => { console.error(e); toast("Buy failed."); }));

    const btnRefresh = $("refreshStatsBtn");
    if (btnRefresh) btnRefresh.addEventListener("click", () => refreshStats());

    const copyBtn = $("copyMyReferralLink");
    if (copyBtn) copyBtn.addEventListener("click", copyMyLink);

    const shareBtn = $("shareMyReferralLink");
    if (shareBtn) shareBtn.addEventListener("click", shareMyLink);

    // auto-show ref address info
    const ref = getRefFromUrl();
    const refBadge = $("refBadge");
    if (refBadge && ref !== ethers.ZeroAddress) {
      refBadge.style.display = "block";
      refBadge.textContent = `Referral: ${ref}`;
    }

    // Initial stats (will prompt connect if needed)
    // We avoid auto connect; just show placeholders until user connects.
    const net = currentNet();
    const pancakeBtn = $("buyOnPancakeBtn");
    if (pancakeBtn) {
      const url = `https://pancakeswap.finance/swap?chain=bsc&outputCurrency=${net.ibiti}&inputCurrency=${net.usdt}`;
      pancakeBtn.href = url;
      // On testnet, Pancake main UI may not support; keep but label
      if (net.key === "testnet") pancakeBtn.textContent = "Buy on PancakeSwap (main UI)";
    }

    const ct = $("ctAddr");
    if (ct) ct.textContent = net.promoRouter ? net.promoRouter : "(promo router not set)";
  }

  document.addEventListener("DOMContentLoaded", wire);
  // Expose for debugging
  window.IBITI_APP = { connectWallet, refreshStats, buyPromo };
})();
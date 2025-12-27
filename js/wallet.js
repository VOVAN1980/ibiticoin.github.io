/* js/wallet.js — PROD SAFE for current shop.html (no imports, no new IDs) */
(function () {
  "use strict";

  console.log("✅ wallet.js loaded (prod)");

  // ---- hard requirements from your prod page
  if (!window.ethers) {
    console.error("❌ ethers not found. Load ethers.umd.min.js BEFORE wallet.js");
    return;
  }
  if (!window.IBITI_CONFIG || typeof window.IBITI_CONFIG.getNet !== "function") {
    console.error("❌ IBITI_CONFIG.getNet() not found. Load js/config.js BEFORE wallet.js");
    return;
  }

  const { ethers } = window;

  // ---- helpers
  const $ = (id) => document.getElementById(id);
  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  const safeAddr = (a) => { try { return ethers.getAddress(a); } catch { return null; } };

  function setText(id, t) { const el = $(id); if (el) el.textContent = t; }

  function getActiveNet() {
    // uses your existing config.js
    return window.IBITI_CONFIG.getNet(); // { chainIdHex, chainName, rpcUrls, blockExplorerUrls, nativeCurrency, ibiti, ... }
  }

  async function ensureWalletOnActive(active) {
    if (!window.ethereum) return;

    let chainId = null;
    try { chainId = await window.ethereum.request({ method: "eth_chainId" }); } catch (_) {}

    const target = String(active.chainIdHex || "").toLowerCase();
    if (chainId && String(chainId).toLowerCase() === target) return;

    // try switch
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: active.chainIdHex }]
      });
      return;
    } catch (e) {
      // if unknown chain -> add then switch
      const code = e?.code ?? e?.data?.originalError?.code;
      const msg = String(e?.message || "").toLowerCase();
      const unknown = code === 4902 || msg.includes("4902") || msg.includes("unrecognized chain");

      if (!unknown) throw e;

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: active.chainIdHex,
          chainName: active.chainName,
          rpcUrls: active.rpcUrls,
          blockExplorerUrls: active.blockExplorerUrls,
          nativeCurrency: active.nativeCurrency
        }]
      });

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: active.chainIdHex }]
      });
    }
  }

  // ---- globals expected by other scripts
  window.provider = null;
  window.signer = null;
  window.selectedAccount = null;

  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  async function showIbitiBalance(active) {
    try {
      const token = safeAddr(active.ibiti);
      const acc = window.selectedAccount;
      const signer = window.signer;
      if (!token || !acc || !signer) return;

      const c = new ethers.Contract(token, ERC20_ABI, signer);
      let dec = 8;
      try { dec = Number(await c.decimals()); } catch (_) {}
      const bal = await c.balanceOf(acc);
      setText("ibitiBalance", ethers.formatUnits(bal, dec));
    } catch (e) {
      console.warn("showIbitiBalance:", e);
    }
  }

  function paintNetBadge() {
    const badge = $("netBadge");
    if (!badge) return;
    const mode = (window.IBITI_CONFIG.detectMode && window.IBITI_CONFIG.detectMode()) || "mainnet";
    if (mode === "testnet") {
      badge.style.display = "block";
      badge.textContent = "TESTNET MODE";
    } else {
      badge.style.display = "none";
    }
  }

  async function initAfterConnect() {
    const active = getActiveNet();
    window.IBITI_ACTIVE = active; // optional, doesn't break anything

    paintNetBadge();
    await ensureWalletOnActive(active);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const account = await signer.getAddress();

    window.provider = provider;
    window.signer = signer;
    window.selectedAccount = account;

    setText("walletAddress", account);

    await showIbitiBalance(active);

    // don't invent new functions — just call existing if they exist
    try { if (typeof window.initSaleContract === "function") await window.initSaleContract(); } catch (_) {}
    try { if (typeof window.loadPromoStats === "function") window.loadPromoStats(); } catch (_) {}
  }

  let listenersBound = false;

  async function connectWallet() {
    try {
      // Mobile обычный браузер -> отправляем на твою existing страницу выбора кошелька
      if (!window.ethereum) {
        if (isMobile()) {
          const u = new URL("/open-in-wallet.html", location.origin);
          u.searchParams.set("redirect", location.href);
          location.href = u.toString();
          return;
        }
        alert("Wallet not found. Open this page inside MetaMask/Trust wallet browser.");
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      await initAfterConnect();

      if (!listenersBound) {
        listenersBound = true;

        window.ethereum.on("accountsChanged", async (accs) => {
          if (!accs || !accs.length) return;
          await initAfterConnect();
        });

        window.ethereum.on("chainChanged", async () => {
          await initAfterConnect();
        });
      }
    } catch (e) {
      console.error("connectWallet:", e);
      alert(e?.message || "Wallet connect error");
    }
  }

  // expose exact name
  window.connectWallet = connectWallet;

  // Bind to your existing buttons/IDs (no new names)
  function wireUI() {
    paintNetBadge();

    const btn = $("connectWalletBtn");
    if (btn) btn.addEventListener("click", connectWallet);

    const addBtn = $("addTokenBtn");
    if (addBtn) {
      addBtn.addEventListener("click", async () => {
        try {
          if (!window.ethereum) return alert("Open inside wallet browser first.");
          const active = getActiveNet();
          const token = safeAddr(active.ibiti);
          if (!token) return alert("Token address not set.");

          await window.ethereum.request({
            method: "wallet_watchAsset",
            params: {
              type: "ERC20",
              options: {
                address: token,
                symbol: "IBITI",
                decimals: 8
              }
            }
          });
        } catch (e) {
          console.warn("addToken:", e);
          alert("Failed to add token");
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireUI);
  } else {
    wireUI();
  }
})();

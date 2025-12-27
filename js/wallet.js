// js/wallet.js (PROD-safe, no imports)
// - If no window.ethereum on mobile -> redirect to /wallet.html (your HTML wallet picker)
// - Keeps existing globals: selectedAccount, provider, signer, connectWallet

(function () {
  "use strict";

  // anti-double-load
  if (window.__IBITI_WALLET_JS_LOADED__) return;
  window.__IBITI_WALLET_JS_LOADED__ = true;

  console.log("✅ wallet.js loaded (prod)");

  // ---- KEEP GLOBALS (so other scripts won't break) ----
  window.selectedAccount = window.selectedAccount || null;
  window.provider = window.provider || null;
  window.signer = window.signer || null;

  // ---- CONFIG COMPAT LAYER ----
  // Your config is now classic: window.IBITI_CONFIG.getNet()
  // Some old code may expect window.config.getActive() / ensureWalletOnActive()
  if (!window.config) window.config = {};

  window.config.getActive = window.config.getActive || (async function () {
    if (window.IBITI_CONFIG && typeof window.IBITI_CONFIG.getNet === "function") {
      return window.IBITI_CONFIG.getNet();
    }
    return {};
  });

  window.config.ensureWalletOnActive = window.config.ensureWalletOnActive || (async function () {
    if (!window.ethereum || !window.ethereum.request) return;

    const active = await window.config.getActive();
    const chainIdHex = active.chainIdHex || active.chainIdHex;
    if (!chainIdHex) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch (e) {
      // 4902 = chain not added
      if (e && (e.code === 4902 || String(e.message || "").includes("4902"))) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: active.chainIdHex,
              chainName: active.chainName,
              rpcUrls: active.rpcUrls,
              blockExplorerUrls: active.blockExplorerUrls,
              nativeCurrency: active.nativeCurrency
            }],
          });
        } catch (addErr) {
          console.warn("wallet_addEthereumChain failed:", addErr);
        }
      } else {
        console.warn("wallet_switchEthereumChain failed:", e);
      }
    }
  });

  // ---- HELPERS ----
  function $(id) { return document.getElementById(id); }

  function setText(id, t) {
    const el = $(id);
    if (el) el.textContent = t;
  }

  function isMobileLike() {
    const ua = (navigator.userAgent || "").toLowerCase();
    return /android|iphone|ipad|ipod|mobile/.test(ua);
  }

  function buildShopUrl() {
    // keep current URL incl query/hash, but ensure path is /shop.html
    const u = new URL(location.href);
    u.pathname = "/shop.html";
    return u.toString();
  }

  function openWalletPicker() {
    // ✅ IMPORTANT: set this to your real file name if different
    const WALLET_PICKER_PATH = "/wallet.html"; // <-- change ONLY this if your file is named differently

    const shopUrl = buildShopUrl();
    const u = new URL(location.origin + WALLET_PICKER_PATH);
    u.searchParams.set("redirect", shopUrl);
    location.href = u.toString();
  }

  async function showIbitiBalance(active) {
    try {
      const ethers = window.ethers;
      if (!ethers || !window.signer || !window.selectedAccount) return;

      // support both formats: active.ibiti OR active.contracts.IBITI_TOKEN
      const tokenAddr =
        (active && active.contracts && active.contracts.IBITI_TOKEN) ||
        (active && active.ibiti) ||
        null;

      if (!tokenAddr) return;

      const ERC20_ABI = [
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)",
      ];

      const c = new ethers.Contract(tokenAddr, ERC20_ABI, window.signer);

      let dec = 8;
      try { dec = Number(await c.decimals()); } catch (_) {}

      const bal = await c.balanceOf(window.selectedAccount);
      const txt = ethers.formatUnits(bal, dec);

      setText("ibitiBalance", `Ваш баланс IBITI: ${txt}`);
    } catch (e) {
      console.warn("showIbitiBalance:", e);
    }
  }

  async function initAfterConnect() {
    const ethers = window.ethers;
    if (!ethers) throw new Error("ethers not found (check ethers.umd include)");

    const active = await window.config.getActive();
    window.config.active = active;

    // ensure correct chain
    await window.config.ensureWalletOnActive();

    window.provider = new ethers.BrowserProvider(window.ethereum);
    window.signer = await window.provider.getSigner();
    window.selectedAccount = await window.signer.getAddress();

    setText("walletAddress", window.selectedAccount);

    console.log(`✅ Active network: ${(active && active.chainName) || (active && active.key) || "unknown"} chainId: ${(active && active.chainIdDec) || "?"}`);

    await showIbitiBalance(active);

    // keep your existing hooks (do not rename)
    if (typeof window.initSaleContract === "function") {
      await window.initSaleContract();
    }
    if (typeof window.loadPromoStats === "function") {
      window.loadPromoStats();
    }
  }

  // ---- MAIN ENTRY (KEEP NAME) ----
  async function connectWallet() {
    try {
      // If not in wallet browser -> open wallet picker page (mobile + desktop too, safer)
      if (!window.ethereum) {
        // on mobile this is the expected path
        openWalletPicker();
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      await initAfterConnect();

      // events
      if (!window.__IBITI_WALLET_EVENTS_BOUND__) {
        window.__IBITI_WALLET_EVENTS_BOUND__ = true;

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
      alert((e && e.message) ? e.message : "Ошибка подключения кошелька");
    }
  }

  window.connectWallet = connectWallet;

})();

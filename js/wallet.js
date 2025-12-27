/* js/wallet.js — PROD SAFE, uses existing wallet.html, no imports */
(function () {
  "use strict";

  // prevent double-run
  if (window.__IBITI_WALLET_LOADED__) return;
  window.__IBITI_WALLET_LOADED__ = true;

  console.log("✅ wallet.js loaded (prod)");

  function isMobile() {
    return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || "");
  }

  function goToWalletHtml() {
    const u = new URL("/wallet.html", location.origin); // ✅ ТОЛЬКО wallet.html
    u.searchParams.set("redirect", location.href);
    location.href = u.toString();
  }

  // keep old globals for other scripts
  window.selectedAccount = window.selectedAccount || null;
  window.provider = window.provider || null;
  window.signer = window.signer || null;

  async function initAfterConnect() {
    // ethers должен быть подключен на странице ОДИН раз
    if (!window.ethers) throw new Error("ethers not found (ethers.umd must be loaded once)");
    const { ethers } = window;

    // IBITI_CONFIG должен быть подключен (твой classic config.js)
    const active = (window.IBITI_CONFIG && window.IBITI_CONFIG.getNet)
      ? window.IBITI_CONFIG.getNet()
      : null;

    // switch chain если нужно (аккуратно)
    if (window.ethereum && active && active.chainIdHex) {
      try {
        const current = await window.ethereum.request({ method: "eth_chainId" });
        if (String(current).toLowerCase() !== String(active.chainIdHex).toLowerCase()) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: active.chainIdHex }]
          });
        }
      } catch (e) {
        // если сеть не добавлена
        const msg = String(e?.message || "");
        if (e?.code === 4902 || msg.includes("4902")) {
          try {
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
          } catch (addErr) {
            console.warn("add chain failed:", addErr);
          }
        } else {
          console.warn("switch chain failed:", e);
        }
      }
    }

    // connect provider/signer/account
    window.provider = new ethers.BrowserProvider(window.ethereum);
    window.signer = await window.provider.getSigner();
    window.selectedAccount = await window.signer.getAddress();

    // UI (если элементы есть)
    try { document.getElementById("walletAddress").textContent = window.selectedAccount; } catch (_) {}

    // balance IBITI (если знаем адрес токена)
    try {
      const tokenAddr = active?.ibiti || active?.contracts?.IBITI_TOKEN;
      if (tokenAddr) {
        const ERC20_ABI = [
          "function balanceOf(address) view returns (uint256)",
          "function decimals() view returns (uint8)"
        ];
        const c = new ethers.Contract(tokenAddr, ERC20_ABI, window.signer);
        let dec = 8;
        try { dec = Number(await c.decimals()); } catch (_) {}
        const bal = await c.balanceOf(window.selectedAccount);
        const txt = ethers.formatUnits(bal, dec);
        const el = document.getElementById("ibitiBalance");
        if (el) el.textContent = txt; // у тебя может быть просто число, не текст
      }
    } catch (e) {
      console.warn("balance failed:", e);
    }

    // вызвать существующие хуки, если они есть
    try { if (typeof window.initSaleContract === "function") await window.initSaleContract(); } catch (_) {}
    try { if (typeof window.loadPromoStats === "function") window.loadPromoStats(); } catch (_) {}
  }

  async function connectWallet() {
    try {
      // если не внутри DApp браузера — на мобиле отправляем в wallet.html
      if (!window.ethereum) {
        if (isMobile()) return goToWalletHtml();
        alert("Wallet provider not found. Open this page inside MetaMask/Trust wallet browser.");
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      await initAfterConnect();

      // events (один раз)
      if (!window.__IBITI_WALLET_EVENTS__) {
        window.__IBITI_WALLET_EVENTS__ = true;

        window.ethereum.on("accountsChanged", async (accs) => {
          if (!accs?.length) return;
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

  window.connectWallet = connectWallet;
})();

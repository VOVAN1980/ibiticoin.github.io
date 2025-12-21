/* IBITIcoin site config (classic script, no imports) */
(function () {
  "use strict";

  const NETWORKS = {
    mainnet: {
      key: "mainnet",
      chainIdDec: 56,
      chainIdHex: "0x38",
      chainName: "BNB Smart Chain",
      rpcUrls: ["https://bsc-dataseed.binance.org/"],
      blockExplorerUrls: ["https://bscscan.com"],
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },

      ibiti: "0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb",
      usdt:  "0x55d398326f99059fF775485246999027B3197955",
      pancakeRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
      promoRouter: null, // set after mainnet deploy
      slippageBps: 300
    },

    testnet: {
      key: "testnet",
      chainIdDec: 97,
      chainIdHex: "0x61",
      chainName: "BNB Smart Chain Testnet",
      rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
      blockExplorerUrls: ["https://testnet.bscscan.com"],
      nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },

      // ✅ current testnet deployment from your logs
      usdt:  "0x25F48F48bFfc6D9901d32Dc6c76A2C4486C4E55d",
      ibiti: "0x8975221CCceF486DBCcC4CCa282662e36280577D",
      pancakeRouter: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
      promoRouter:  "0x131f8AC959e5D27105485397a63F614F4c5c2aA5",
      slippageBps: 300
    }
  };

  function getQueryParam(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }

  function detectMode() {
    const q = (getQueryParam("net") || "").toLowerCase();
    if (q === "testnet" || q === "t" || q === "97") return "testnet";
    if (q === "mainnet" || q === "m" || q === "56") return "mainnet";

    // optional sticky mode for dev
    const saved = (localStorage.getItem("ibiti_net") || "").toLowerCase();
    if (saved === "testnet" || saved === "mainnet") return saved;

    return "mainnet";
  }

  function setMode(mode) {
    if (mode !== "mainnet" && mode !== "testnet") return;
    localStorage.setItem("ibiti_net", mode);
  }

  function getNet() {
    const mode = detectMode();
    return NETWORKS[mode];
  }

  window.IBITI_CONFIG = {
    NETWORKS,
    detectMode,
    setMode,
    getNet
  };
})();

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
      // Set after mainnet deploy:
      promoRouter: null,

      pancakeSwapUrl: "https://pancakeswap.finance/swap?chain=bsc&outputCurrency=0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb&inputCurrency=0x55d398326f99059fF775485246999027B3197955",
      nftGalleryUrl: "nft.html"
    },

    testnet: {
      key: "testnet",
      chainIdDec: 97,
      chainIdHex: "0x61",
      chainName: "BNB Smart Chain Testnet",
      rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
      blockExplorerUrls: ["https://testnet.bscscan.com"],
      nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },

      // Latest TESTNET deploy from your logs:
      usdt:  "0x25F48F48bFfc6D9901d32Dc6c76A2C4486C4E55d",
      ibiti: "0x8975221CCceF486DBCcC4CCa282662e36280577D",
      promoRouter: "0x131f8AC959e5D27105485397a63F614F4c5c2aA5",
    logScanBlocks: 250000,

      // Regular buy still goes to MAINNET PancakeSwap (your rule).
      pancakeSwapUrl: "https://pancakeswap.finance/swap?chain=bsc&outputCurrency=0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb&inputCurrency=0x55d398326f99059fF775485246999027B3197955",
      nftGalleryUrl: "nft.html"
    }
  };

  function detectMode() {
    const url = new URL(window.location.href);
    const q = (url.searchParams.get("net") || "").toLowerCase();
    if (q === "testnet" || q === "t") return "testnet";
    if (q === "mainnet" || q === "main" || q === "prod") return "mainnet";
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

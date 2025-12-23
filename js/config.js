/* IBITIcoin site config (classic script, no imports) */
(function () {
  "use strict";

  const PROD_HOSTS = new Set(["ibiticoin.com", "www.ibiticoin.com"]);
  const LS_KEY = "ibiti_net";

  const NETWORKS = {
    mainnet: {
      key: "mainnet",
      chainIdDec: 56,
      chainIdHex: "0x38",
      chainName: "BNB Smart Chain",
      rpcUrls: ["https://bsc-dataseed.binance.org/"],
      reownProjectId: "95f126f3a088cebcf781d2a1c10711fc",
      blockExplorerUrls: ["https://bscscan.com"],
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },

      ibiti: "0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb",
      usdt:  "0x55d398326f99059fF775485246999027B3197955",
      pancakeRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
      promoRouter: "",
      slippageBps: 300
    },

    testnet: {
      key: "testnet",
      chainIdDec: 97,
      chainIdHex: "0x61",
      chainName: "BNB Smart Chain Testnet",
      rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
      reownProjectId: "95f126f3a088cebcf781d2a1c10711fc",
      blockExplorerUrls: ["https://testnet.bscscan.com"],
      nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },

      usdt:  "0x25F48F48bFfc6D9901d32Dc6c76A2C4486C4E55d",
      ibiti: "0x8975221CCceF486DBCcC4CCa282662e36280577D",
      pancakeRouter: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
      promoRouter:   "0x131f8AC959e5D27105485397a63F614F4c5c2aA5",
      slippageBps: 300
    }
  };

  function getQueryParam(name) {
    return new URL(window.location.href).searchParams.get(name);
  }

  function normalizeMode(v) {
    const q = String(v || "").toLowerCase().trim();
    if (q === "testnet" || q === "t" || q === "97") return "testnet";
    if (q === "mainnet" || q === "m" || q === "56") return "mainnet";
    return null;
  }

  function isProdHost() {
    return PROD_HOSTS.has(String(location.hostname || "").toLowerCase());
  }

  // ✅ идеальная логика для прода:
  // - URL ?net=... всегда имеет приоритет
  // - на prod без ?net=... всегда mainnet (игнорируем localStorage, чтобы никто не “залипал” в testnet)
  // - на dev можно “запоминать” localStorage
  function detectMode() {
    const fromUrl = normalizeMode(getQueryParam("net"));
    if (fromUrl) return fromUrl;

    if (isProdHost()) return "mainnet";

    let saved = null;
    try { saved = normalizeMode(localStorage.getItem(LS_KEY)); } catch (_) {}
    if (saved) return saved;

    return "mainnet";
  }

  // setMode сохраняем для dev/ручного переключения,
  // на prod оно не влияет без ?net=... (и это хорошо)
  function setMode(mode) {
    const m = normalizeMode(mode);
    if (!m) return;
    try { localStorage.setItem(LS_KEY, m); } catch (_) {}
  }

  function getNet() {
    return NETWORKS[detectMode()] || NETWORKS.mainnet;
  }

  // опционально: удобный хелпер для тестов (не обязателен)
  function clearSavedMode() {
    try { localStorage.removeItem(LS_KEY); } catch (_) {}
  }

  window.IBITI_CONFIG = {
    NETWORKS,
    detectMode,
    setMode,
    getNet,
    clearSavedMode
  };
})();




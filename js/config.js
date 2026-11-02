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

      ibiti: "0x71b552D3503fe20610aaA470A96E1838fae8381A",
      usdt:  "0x55d398326f99059fF775485246999027B3197955",
      pancakeRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
      promoRouter: "0x42924EE213eF1943BE655c2C535FB72F52C64781",
      staking: "0x82BA8720FBa8a6A939D078b9ed62afB9ABC3B426",
      nftSale: "0x44E65077168De8Ff5EC6545857DAd2cB02310fe2",
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

      usdt:  "0xe4221B295012D583347d400BA28f5783d61c7E13",
      ibiti: "0x4D641C74529B39e3C4Cc996B5b5be47A0B61dD0C",
      pancakeRouter: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
      promoRouter:   "0x5143E30336F5c04214BeFeFB44398839344b0B01",
      staking: "0x835aa5a8ddD01E619db2Bd2E751755867aeb87fE",
      nftSale: "0xD0d12Ef7CF15015322D2DEAf99114d3E0684dc4A",
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






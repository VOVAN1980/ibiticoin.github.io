// js/config.js (REWRITE: testnet-first, URL override, config.active поддержка)

const NETWORKS = {
  testnet: {
    key: "testnet",
    name: "BSC Testnet",
    chainId: 97,
    contracts: {
      USDT_TOKEN: "0x25F48F48bFfc6D9901d32Dc6c76A2C4486C4E55d",
      IBITI_TOKEN: "0x8975221CCceF486DBCcC4CCa282662e36280577D",
      REFERRAL_SWAP_ROUTER: "0x131f8AC959e5D27105485397a63F614F4c5c2aA5",
      PANCAKESWAP_ROUTER: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
    },
  },

  mainnet: {
    key: "mainnet",
    name: "BSC Mainnet",
    chainId: 56,
    contracts: {
      USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
      IBITI_TOKEN: "0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb",
      // MAINNET router позже вставишь после деплоя:
      REFERRAL_SWAP_ROUTER: "",
      PANCAKESWAP_ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    },
  },
};

function parseNetFromUrl() {
  const q = new URLSearchParams(location.search);
  const forced = (q.get("net") || "").toLowerCase();
  if (forced === "testnet" || forced === "mainnet") return forced;
  return null;
}

function getSavedNet() {
  const v = (localStorage.getItem("ibiti_net") || "").toLowerCase();
  if (v === "testnet" || v === "mainnet") return v;
  return null;
}

function saveNet(key) {
  localStorage.setItem("ibiti_net", key);
}

async function detectNetFromWallet() {
  try {
    if (!window.ethereum) return null;
    const hex = await window.ethereum.request({ method: "eth_chainId" });
    const cid = Number(hex);
    if (cid === 97) return "testnet";
    if (cid === 56) return "mainnet";
    return null;
  } catch {
    return null;
  }
}

function warnMismatch(forcedKey, walletKey) {
  if (!forcedKey || !walletKey) return;
  if (forcedKey !== walletKey) {
    console.warn(
      `⚠️ Network mismatch: URL forces "${forcedKey}", but wallet is on "${walletKey}". ` +
      `Switch network in wallet or remove ?net=...`
    );
  }
}

const config = {
  networks: NETWORKS,
  active: NETWORKS.testnet, // дефолт сразу testnet (ты сейчас в тестах)

  /**
   * Выбор сети по строгому приоритету:
   * 1) URL ?net=testnet|mainnet (ЖЁСТКО)
   * 2) wallet chainId
   * 3) localStorage ibiti_net
   * 4) default testnet
   */
  async getActive() {
    const forced = parseNetFromUrl();
    const byWallet = await detectNetFromWallet();
    const saved = getSavedNet();

    const key = forced || byWallet || saved || "testnet";

    if (!NETWORKS[key]) {
      // на всякий случай
      config.active = NETWORKS.testnet;
      saveNet("testnet");
      return config.active;
    }

    warnMismatch(forced, byWallet);

    config.active = NETWORKS[key];
    saveNet(key);
    return config.active;
  },

  async isTestnet() {
    const a = await config.getActive();
    return a.chainId === 97;
  },

  async requireTestnet() {
    const a = await config.getActive();
    if (a.chainId !== 97) {
      throw new Error(`This page is in TESTNET mode, but wallet/network is not testnet. Active=${a.name} chainId=${a.chainId}`);
    }
    return a;
  },

  async print() {
    const a = await config.getActive();
    console.log("✅ Active config:", {
      key: a.key,
      name: a.name,
      chainId: a.chainId,
      contracts: a.contracts
    });
    return a;
  }
};

export default config;

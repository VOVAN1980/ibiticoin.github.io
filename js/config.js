// js/config.js
const NETWORKS = {
  testnet: {
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
    name: "BSC Mainnet",
    chainId: 56,
    contracts: {
      USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
      IBITI_TOKEN: "0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb",
      // сюда вставишь после mainnet деплоя роутера:
      REFERRAL_SWAP_ROUTER: "", 
      PANCAKESWAP_ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    },
  },
};

function getPreferred() {
  const q = new URLSearchParams(location.search);
  const forced = q.get("net"); // ?net=testnet или ?net=mainnet
  if (forced === "testnet" || forced === "mainnet") return forced;

  return localStorage.getItem("ibiti_net") || "mainnet";
}

function setPreferred(key) {
  localStorage.setItem("ibiti_net", key);
}

async function detectByWallet() {
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

const config = {
  networks: NETWORKS,

  // всегда отдаём актуальную сеть: wallet -> query/localStorage -> default
  async getActive() {
    const byWallet = await detectByWallet();
    const key = byWallet || getPreferred();
    setPreferred(key);
    return NETWORKS[key];
  },
};

export default config;

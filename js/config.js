// js/config.js (HARD TESTNET MODE + switch)
const NETWORKS = {
  testnet: {
    key: "testnet",
    name: "BSC Testnet",
    chainId: 97,
    chainIdHex: "0x61",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    explorer: "https://testnet.bscscan.com",
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
    chainIdHex: "0x38",
    rpcUrl: "https://bsc-dataseed.binance.org",
    explorer: "https://bscscan.com",
    contracts: {
      USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
      IBITI_TOKEN: "0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb",
      REFERRAL_SWAP_ROUTER: "", // пусто — потому что mainnet ещё не делали
      PANCAKESWAP_ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    },
  },
};

function parseNetFromUrl() {
  const q = new URLSearchParams(location.search);
  const forced = (q.get("net") || "").toLowerCase();
  return (forced === "testnet" || forced === "mainnet") ? forced : null;
}

async function walletChainId() {
  try {
    if (!window.ethereum) return null;
    const hex = await window.ethereum.request({ method: "eth_chainId" });
    return Number(hex);
  } catch { return null; }
}

const config = {
  networks: NETWORKS,
  active: NETWORKS.testnet,

  async getActive() {
    const forced = parseNetFromUrl();
    const key = forced || "testnet"; // ✅ пока тестируем — ВСЕГДА testnet по умолчанию
    config.active = NETWORKS[key];
    localStorage.setItem("ibiti_net", key);
    return config.active;
  },

  async ensureWalletOnActive() {
    const a = await config.getActive();
    const cid = await walletChainId();
    if (!cid) return; // нет кошелька — ок, статы можно читать по rpc

    if (cid === a.chainId) return; // уже там

    // переключаем сеть
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: a.chainIdHex }],
      });
    } catch (e) {
      // если сети нет — добавляем
      if (e && (e.code === 4902 || e?.data?.originalError?.code === 4902)) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: a.chainIdHex,
            chainName: a.name,
            rpcUrls: [a.rpcUrl],
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            blockExplorerUrls: [a.explorer],
          }],
        });
      } else {
        throw e;
      }
    }
  },
};

export default config;

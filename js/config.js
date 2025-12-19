// js/config.js — минимальный вариант только под BSC Testnet

const config = {
  active: {
    networkName: "BSC Testnet",
    chainId: 97,
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    explorerUrl: "https://testnet.bscscan.com",

    contracts: {
      // тестнет USDT (твой)
      USDT_TOKEN:          "0xDC8eD79f9889F630Dc8083e5fD8C5294f1B603bb",

      // тестнет IBITI
      IBITI_TOKEN:         "0xc230f9394875305ac83013C0186a400865bc8f86",

      // PancakeSwap v2 на BSC testnet
      PANCAKESWAP_ROUTER:  "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",

      // твой ReferralSwapRouter на testnet
      REFERRAL_SWAP_ROUTER:"0x3c2E3B388BA1c387eEfa58816f00A81D2921A1Fa",
    }
  }
};

export default config;



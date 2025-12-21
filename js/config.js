const config = {
  mainnet: {
    networkName: "BSC Mainnet",
    chainId: 56,
    rpcUrl: "https://rpc.ankr.com/bsc/4dc6f6e684cd1df11bb6f81c742b0597781ed9aee0365faf48669a2bc06d3058",
    explorerUrl: "https://bscscan.com",
    saleDeployBlock: 51339916,

    contracts: {
      USDT_TOKEN:           "0x55d398326f99059fF775485246999027B3197955",
      IBITI_TOKEN:          "0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb",
      PANCAKESWAP_ROUTER:   "0x10ED43C718714eb63d5aA57B78B54704E256024E",

      FEE_MANAGER:          "0x34770ba3625437742e18C6827DFC893c42Eec956",
      USER_STATUS_MANAGER:  "0xf1C734156A2Ab62e1018D18f6347425623af611a",
      BRIDGE_MANAGER:       "0x813d2d93a3EfDFe8B09513b09B7CbdE06B239113",
      NFTDISCOUNT:          "0x911f7153AA7554b3f936f2ad05318B8368c14668",
      IBITI_PRICE_ORACLE:   "0x09e28925487841f0400687FD9DC9cf1d14B85aF3",

      TEAM_VESTING:         "0xae6fA65adede487e46ABCE1b3570063D02510d5d",
      STAKING_MODULE:       "0x9ad8D68F7a6C9f673bd1db8348734f8dA515113c",
      DAO_MODULE:           "0xc0213d9d331Ea207717E38F5e0e995BA567fbd1F",

      IBITI_NFT_ADDRESS:    "0xE14bfBB10180eda4bDC574f02700e0E2BC0A4667",
      NFTSALEMANAGER:       "0x2c702A42966a939b6C5Da4828cd8D67890Db097E",

      PHASED_TOKENSALE:     "0x6A6eDc85f4690DBAB98d52CdF656ef849d28148e",
      BUYBACK_MANAGER:      "0xdE7E16bbDe9076daF23DB25BA4E50d8FEeca5AC9",

      PHASED_REWARD_AMOUNT: 100000000,

      // ✅ ПУСТО пока не деплоили на mainnet — но поле есть, чтобы ничего не падало
      REFERRAL_SWAP_ROUTER: ""
    }
  },

  testnet: {
  networkName: "BSC Testnet",
  chainId: 97,
  rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  explorerUrl: "https://testnet.bscscan.com",

  // ✅ ВОТ СЮДА, ПРЯМО ЗДЕСЬ:
  promoDeployTx: "0x21954e13c521c2cb9098e2f7508a09bea990cb86cab149c3f7473aa1b45bb424",

  contracts: {
    USDT_TOKEN: "0x25F48F48bFfc6D9901d32Dc6c76A2C4486C4E55d",
    IBITI_TOKEN:"0xF7d5Fe8586FFf60b8905dB4b84B7bDafB1199545",
    REFERRAL_SWAP_ROUTER:"0x131f8AC959e5D27105485397a63F614F4c5c2aA5",
    PANCAKESWAP_ROUTER:"0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
  }
},

  localhost: {
    networkName: "Localhost",
    chainId: 31337,
    rpcUrl: "http://127.0.0.1:8545",
    explorerUrl: "",
    contracts: {
      USDT_TOKEN:      "0x2aebA8f3e548DAD183107eC481459AB66fAD42b8",
      IBITI_TOKEN:     "0xE3422F1EdE8875470553F9fBBE50F1f4699ae86f",
      NFTDISCOUNT:     "0x4723A7d9dE6402606634FE2CaFbEC5e240Ea47fe",
      PHASED_TOKENSALE:"0xeed8260f27BdbBD8e79761541C63a1D82A33518c"
    }
  }
};

// сейчас тестим на TESTNET
config.active = config.testnet;

// === Promo stats for sale.js ===
window.PROMO_STATS = {
  [config.testnet.chainId]: {
    ibiti:  config.testnet.contracts.IBITI_TOKEN,
    usdt:   config.testnet.contracts.USDT_TOKEN,
    router: config.testnet.contracts.REFERRAL_SWAP_ROUTER,
    fromBlock: 0
  },
  [config.mainnet.chainId]: {
    ibiti:  config.mainnet.contracts.IBITI_TOKEN,
    usdt:   config.mainnet.contracts.USDT_TOKEN,
    router: config.mainnet.contracts.REFERRAL_SWAP_ROUTER || "",
    fromBlock: config.mainnet.saleDeployBlock || 0
  }
};

// делаем доступным в консоли и другим скриптам
window.config = config;
window.APP_CONFIG = config;


export default config;







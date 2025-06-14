// config.js — унифицированный конфиг сетей и адресов
const config = {
  mainnet: {
    networkName: "BSC Mainnet",
    chainId: 56,
    rpcUrl: "https://rpc.ankr.com/bsc/4dc6f6e684cd1df11bb6f81c742b0597781ed9aee0365faf48669a2bc06d3058",
    explorerUrl: "https://bscscan.com",
    contracts: {
      USDT_TOKEN:         "0x55d398326f99059fF775485246999027B3197955",
      IBITI_TOKEN:        "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196",
      PANCAKESWAP_ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
      FEE_MANAGER:        "0x34770ba3625437742e18C6827DFC893c42Eec956",
      USER_STATUS_MANAGER:"0xa1542720cC6952ec1E528411cCdC58FE60fa7996",
      BRIDGE_MANAGER:     "0x813d2d93a3EfDFe8B09513b09B7CbdE06B239113",
      NFT_DISCOUNT:       "0x911f7153AA7554b3f936f2ad05318B8368c14668",
      PRICE_ORACLE:       "0x09e28925487841f0400687FD9DC9cf1d14B85aF3",
      TEAM_VESTING:       "0xA8E6a8707EBB386C839881f99391C8af2db3DB5e",
      STAKING_MODULE:     "0xd5D138855C7D8F24CD9eE52B65864bC3929a0aA5",
      DAO_MODULE:         "0xd5D170D80aDb59b189873540cFa25Ca508B336d3",
      IBITI_NFT:          "0xE14bfBB10180eda4bDC574f02700e0E2BC0A4667",
      NFT_SALE_MANAGER:   "0x804Fe412bF8B1e21475e6F6c368b0400250bBDdd",
      BUYBACK_MANAGER:    "0xAfDFE70d3531582789D6Ba5Bd56fDCFd43a4AC5E",
      PHASED_SALE:        "0x94b9a9b1FEC563cF16cA42a14c81C42284eD6Ca1",
      PHASED_REWARD:      100000000
    }
  },

  testnet: {
    networkName: "BSC Testnet",
    chainId: 97,
    rpcUrl: process.env.BSC_RPC_URL,
    explorerUrl: "https://testnet.bscscan.com",
    contracts: {
      USDT_TOKEN:         process.env.USDT_TOKEN_ADDRESS_TESTNET,
      PANCAKESWAP_ROUTER: process.env.PANCAKESWAP_ROUTER_ADDRESS,

      FEE_MANAGER:        process.env.FEE_MANAGER_ADDRESS,
      USER_STATUS_MANAGER:process.env.USER_STATUS_MANAGER_ADDRESS,
      BRIDGE_MANAGER:     process.env.BRIDGE_MANAGER_ADDRESS,
      NFT_DISCOUNT:       process.env.NFTDISCOUNT_ADDRESS,
      PRICE_ORACLE:       process.env.IBITI_PRICE_ORACLE_ADDRESS,
      TEAM_VESTING:       process.env.TEAM_VESTING_ADDRESS,
      STAKING_MODULE:     process.env.STAKING_MODULE_ADDRESS,
      DAO_MODULE:         process.env.DAO_MODULE_ADDRESS,
      IBITI_TOKEN:        process.env.IBITI_TOKEN_ADDRESS,
      IBITI_NFT:          process.env.IBITINFT_ADDRESS,
      NFT_SALE_MANAGER:   process.env.NFTSALEMANAGER_ADDRESS,
      BUYBACK_MANAGER:    process.env.BUYBACK_MANAGER_ADDRESS,
      // скриптом добавленные:
      ERC20MOCK:          process.env.ERC20MOCK_ADDRESS,
      VW_ORACLE:          process.env.VW_ORACLE_ADDRESS,
      MOCK_PAIR:          process.env.MOCK_PAIR_ADDRESS,
      MOCK_ROUTER:        process.env.MOCK_ROUTER_ADDRESS,
      PHASED_SALE:        process.env.PHASED_TOKENSALE_ADDRESS,
      // параметры PhasedTokenSale
      REF_RESERVE:        Number(process.env.REF_RESERVE),
      VOL_RESERVE:        Number(process.env.VOL_RESERVE)
    }
  },

  localhost: {
    networkName: "Localhost",
    chainId: 31337,
    rpcUrl: "http://127.0.0.1:8545",
    explorerUrl: "",
    contracts: {
      USDT_TOKEN:   "0xB6969FA6ecBC9186dF0e36F9eCBdda7Cd6207794",
      IBITI_TOKEN:  "0xDe49559FA3f082BbEF4C3311f0A7Aa745BD30A9f",
      NFT_DISCOUNT: "0x4723A7d9dE6402606634FE2CaFbEC5e240Ea47fe",
      PHASED_SALE:  "0xeed8260f27BdbBD8e79761541C63a1D82A33518c"
    }
  }
};

// Активная сеть: выбирается здесь
// для Mainnet: config.active = config.mainnet
// для Testnet: config.active = config.testnet
config.active = config.testnet;

export default config;

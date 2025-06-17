// config.js — унифицированный конфиг сетей и адресов
const config = {
  mainnet: {
    networkName: "BSC Mainnet",
    chainId: 56,
    rpcUrl: "https://rpc.ankr.com/bsc/4dc6f6e684cd1df11bb6f81c742b0597781ed9aee0365faf48669a2bc06d3058",
    explorerUrl: "https://bscscan.com",
    contracts: {
      USDT_TOKEN:           "0x55d398326f99059fF775485246999027B3197955",
      IBITI_TOKEN:          "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196",
      PANCAKESWAP_ROUTER:   "0x10ED43C718714eb63d5aA57B78B54704E256024E",
      FEE_MANAGER:          "0x34770ba3625437742e18C6827DFC893c42Eec956",
      USER_STATUS_MANAGER:  "0xa1542720cC6952ec1E528411cCdC58FE60fa7996",
      BRIDGE_MANAGER:       "0x813d2d93a3EfDFe8B09513b09B7CbdE06B239113",
      NFTDISCOUNT:          "0x911f7153AA7554b3f936f2ad05318B8368c14668",
      IBITI_PRICE_ORACLE:   "0x09e28925487841f0400687FD9DC9cf1d14B85aF3",
      TEAM_VESTING:         "0xA8E6a8707EBB386C839881f99391C8af2db3DB5",
      STAKING_MODULE:       "0xd5D138855C7D8F24CD9eE52B65864bC3929a0aA5",
      DAO_MODULE:           "0xd5D170D80aDb59b189873540cFa25Ca508B336d3",
      IBITI_NFT_ADDRESS:    "0xE14bfBB10180eda4bDC574f02700e0E2BC0A4667",
      NFTSALEMANAGER:       "0x804Fe412bF8B1e21475e6F6c368b0400250bBDdd",
      PHASED_TOKENSALE:     "0x94b9a9b1FEC563cF16cA42a14c81C42284eD6Ca1",
      BUYBACK_MANAGER:      "0xAfDFE70d3531582789D6Ba5Bd56fDCFd43a4AC5E",
      PHASED_REWARD_AMOUNT: 100000000
    },
    referralDeployBlock: 0 // TODO: установить номер блока деплоя PhasedTokenSale на Mainnet
  },

  testnet: {
    networkName: "Localhost", // временно обойти проверку даты старта
    chainId: 97,
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    explorerUrl: "https://testnet.bscscan.com",
    contracts: {
      USDT_TOKEN:        "0x035cCC27759f99b393B75140a460F9aA591da149",
      PANCAKESWAP_ROUTER:"0x9ac64cc6e4415144c455bd8e4837fea55603e5c3",
      FEE_MANAGER:       "0xeF25d90ad6911bF25a56D1A2b154db79C7979143",
      USER_STATUS_MANAGER:"0x447d29C6a64893ACa05EeBDF1340b891494c4977",
      BRIDGE_MANAGER:    "0x9F95A8711392329065a290d7ec62F02C4D37441B",
      NFTDISCOUNT:       "0x29cE5782d4e7D97f06C0E7b6d5D4f92264f1519a",
      IBITI_PRICE_ORACLE:"0x9A2452F1517dF7e55b132De8F5268B9b56Cb37ae",
      TEAM_VESTING:      "0x7643cFd770eFeB312357434e3410F9E002736aa8",
      STAKING_MODULE:    "0xD47Ab8B5D0b30EaC0e0074c3B26bF584A7c4C9B7",
      DAO_MODULE:        "0xD650b6F1f08474DAA24bdd30514EDD18C4fe789E",
      IBITI_TOKEN:       "0xf6b163BfD9340DF32b475C514E90bD47f3196C4D",
      IBITI_NFT_ADDRESS: "0xF7d5Fe8586FFf60b8905dB4b84B7bDafB1199545",
      NFTSALEMANAGER:    "0xA3b5C31314960E0E02FdDD05B4f559478214eB7a",
      BUYBACK_MANAGER:   "0x0e53C3C303720e1f33508f2527767F70ad34AC17",
      ERC20MOCK:         "0x3Ed7Aa2967F08aEfB8dAc8DB5d7273E98c49aA01",
      VW_ORACLE:         "0x77883927FC558B9bCA03936473901Bc4173FEb0",
      MOCK_PAIR:         "0x3a8C6c1e311BD1BEc7D50788e146CaeA6CA0c861",
      MOCK_ROUTER:       "0xC15724FCEd509bB9bCA03936473901Bc4173FEb0",
      PHASED_TOKENSALE:  "0xa3C11F6C7cCbA0EeCBb920a43fbA4939956eb929",
      PHASED_REF_RESERVE:100000,
      PHASED_VOL_RESERVE:500000
    },
    referralDeployBlock: 54811712 // номер блока деплоя PhasedTokenSale на Testnet
  },

  localhost: {
    networkName: "Localhost",
    chainId: 31337,
    rpcUrl: "http://127.0.0.1:8545",
    explorerUrl: "",
    contracts: {
      USDT_TOKEN:   "0xB6969FA6ecBC9186dF0e36F9eCBdda7Cd6207794",
      IBITI_TOKEN:  "0xDe49559FA3f082BbEF4C3311f0A7Aa745BD30A9f",
      NFTDISCOUNT:  "0x4723A7d9dE6402606634FE2CaFbEC5e240Ea47fe",
      PHASED_TOKENSALE:"0xeed8260f27BdbBD8e79761541C63a1D82A33518c"
    }
  }
};

// Активная сеть: переключите на config.testnet или config.mainnet
config.active = config.testnet;

export default config;

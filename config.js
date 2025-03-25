// config.js

const config = {
  testnet: {
    networkName: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    explorerUrl: "https://testnet.bscscan.com",
    contracts: {
      IBITI_TOKEN_ADDRESS: "0xEbad3D970a662eCF75dC58A244B214F4210E4041",
      FEE_MANAGER_ADDRESS: "0x2CA8dF0F52E7162b1797a68737456c8e5eEE376d",
      NFTDiscount_ADDRESS: "0x7feaC3cB3Ef990f27e8bdd31604aeEce9d7D9d33",
      IBITI_NFT_ADDRESS: "0x4d1E2a0bA4c5360D89D51EaC463b0e0b3E1861F4",
      IBITI_STAKING_ADDRESS: "0x131D84464458808107364413aBbbf1Fd5009480a",
      DAOMODULE_ADDRESS: "0x0334f3687b2cE55C55185dDC95fb600EdE1E640a",
      USER_STATUS_MANAGER_ADDRESS: "0x1B0Af16D9cc05476Fb89C048201E936dcE8a7c38",
      BRIDGE_MANAGER_ADDRESS: "0x20F708dbB6E07420bAe82207168a42aC32409418",
      ERC20_MOCK_ADDRESS: "0x9108C3Ca3D718eBd56f3252882aE5F1d975b2F1B",
      IBITI_NFT_IMPL_ADDRESS: "0x4d1E2a0bA4c5360D89D51EaC463b0e0b3E1861F4",
      TEAM_VESTING_ADDRESS: "0x4C38734524611b73E4789B9C99770c5B2af5149a"
    }
  },
  mainnet: {
    networkName: "BSC Mainnet",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    chainId: 56,
    explorerUrl: "https://bscscan.com",
    contracts: {
      IBITI_TOKEN_ADDRESS: "0x...", // заполните после деплоя на Mainnet
      FEE_MANAGER_ADDRESS: "0x...",
      NFTDiscount_ADDRESS: "0x...",
      IBITI_NFT_ADDRESS: "0x...",
      IBITI_STAKING_ADDRESS: "0x...",
      DAOMODULE_ADDRESS: "0x...",
      USER_STATUS_MANAGER_ADDRESS: "0x...",
      BRIDGE_MANAGER_ADDRESS: "0x...",
      ERC20_MOCK_ADDRESS: "0x...",
      IBITI_NFT_IMPL_ADDRESS: "0x...",
      TEAM_VESTING_ADDRESS: "0x..."
    }
  }
};

module.exports = config;


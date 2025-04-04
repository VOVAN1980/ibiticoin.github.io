export const config = {
  testnet: {
    networkName: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    explorerUrl: "https://testnet.bscscan.com",
    contracts: {
      IBITI_TOKEN_ADDRESS: "0xBCbB45CE07e6026Ed6A4911b2DCabd0544615fBe",
      FEE_MANAGER_ADDRESS: "0xE9B4b7De116B861A7C24abc290da0978Ff20F1Bf",
      NFTDiscount_ADDRESS: "0x680C093B347C7d6C2DAd24D4796e67eF9694096C",
      IBITI_NFT_ADDRESS: "0x10659Ac9f83e9040Be4c2f86dB4d344B744564eD",
      STAKING_MODULE_ADDRESS: "0x65cCffDA53a82b6a9A34cD744175876EE1A4E6d3",
      DAO_MODULE_ADDRESS: "0x05fEfA3D796D9B3C3558137F66b4fBFbD91dfb98",
      USER_STATUS_MANAGER_ADDRESS: "0x67be311709Ad4B273748a2D30cA11947b8bEb644",
      BRIDGE_MANAGER_ADDRESS: "0x13942f9E4d632426a3BF901aa7404CD4FeA09Be0",
      TEAM_VESTING_ADDRESS: "0x1c31993491166350A79e69839eEb4b1E8b93c266",
      NFT_SALE_MANAGER_ADDRESS: "0xdBae91e49da7096f451C8D3db67E274EB5919e48",
      IBITI_PRICE_ORACLE_ADDRESS: "0xC131cf214C4de4289672153CaB2DeCD9236390BF",
      ERC20_MOCK_ADDRESS: "0xfbd17Ba79cDB6636dEeC9cFc7000c032B2CcAD7c",
      ATTACK_CONTRACT_ADDRESS: "0x1Fe1c158E5b1a395Db72E3d26ba6DF7E29216265"
    }
  },
  mainnet: {
    networkName: "BSC Mainnet",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    chainId: 56,
    explorerUrl: "https://bscscan.com",
    contracts: {
      IBITI_TOKEN_ADDRESS: "0x...",
      FEE_MANAGER_ADDRESS: "0x...",
      NFTDiscount_ADDRESS: "0x...",
      IBITI_NFT_ADDRESS: "0x...",
      STAKING_MODULE_ADDRESS: "0x...",
      DAO_MODULE_ADDRESS: "0x...",
      USER_STATUS_MANAGER_ADDRESS: "0x...",
      BRIDGE_MANAGER_ADDRESS: "0x...",
      TEAM_VESTING_ADDRESS: "0x...",
      NFT_SALE_MANAGER_ADDRESS: "0x...",
      IBITI_PRICE_ORACLE_ADDRESS: "0x...",
      ERC20_MOCK_ADDRESS: "0x...",
      ATTACK_CONTRACT_ADDRESS: "0x..."
    }
  }
};

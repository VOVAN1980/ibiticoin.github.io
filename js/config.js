const config = {
  testnet: {
    networkName: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    explorerUrl: "https://testnet.bscscan.com",
    contracts: {
      IBITI_TOKEN_ADDRESS: "0x5fab4e25c0E75aB4a50Cac19Bf62f58dB8E597c6",
      FEE_MANAGER_ADDRESS: "0x4d417D07c36AE28506E89403FAe92D21aeCB0810",
      NFTDiscount_ADDRESS: "0x776D125B0abf3a6B10d446e9F8c0a96bBDcbC511",
      IBITI_NFT_ADDRESS: "0xbdAcfbf8169f4aC7731c1e311A9F5fFb05C03205",
      STAKING_MODULE_ADDRESS: "0xdfFa546669193DE874D619f73F2562E5a9856faa",
      DAO_MODULE_ADDRESS: "0x154d63F666309c976245c74125D8b05dF5c62Ad8",
      USER_STATUS_MANAGER_ADDRESS: "0x13cfC8A688e2A2aBFE9F0aD64C8c852f406352F2",
      BRIDGE_MANAGER_ADDRESS: "0x8CfcB7Fef728c18Cc2e83EB215F7B3c12020D79D",
      TEAM_VESTING_ADDRESS: "0xB06Ee80544437EF7Bd64ACb646263D14ec0B01Ae",
      NFT_SALE_MANAGER_ADDRESS: "0xf2A9cB2F09C1f1A8103441D13a78330B028a41DA",
      IBITI_PRICE_ORACLE_ADDRESS: "0x538910E9aAa9586A72D0f1e8E8Fe22f21972BA47",
      ERC20_MOCK_ADDRESS: "0xb297eaa6F1aC7D221981AF060182B4769Cd2eB68",
      ATTACK_CONTRACT_ADDRESS: "0xA8d14DD3d3bA075Ec6c63d4b523075D3a1562509"
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

export default config;

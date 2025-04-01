const config = {
  testnet: {
    networkName: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    explorerUrl: "https://testnet.bscscan.com",
    contracts: {
      IBITI_TOKEN_ADDRESS: "0xb6987D8dDDb227FFF8dFd8a300ca876688c89f0e",  // IBITIcoin
      FEE_MANAGER_ADDRESS: "0x81682978bC75F8b64Cc0c0a7C970722AAB9878F3",   // FeeManager
      NFTDiscount_ADDRESS: "0x29854cf8355ef4351aBe62EbFea407FEFe4900e5",    // NFTDiscount
      IBITI_NFT_ADDRESS: "0xa13906A49c182e6354a92fE887BE64a2E22c268F",        // IBITINFT
      STAKING_MODULE_ADDRESS: "0x9e751945b29876c8E8f6FB5E0486428cdd64243E",     // StakingModule
      DAO_MODULE_ADDRESS: "0x277d5cb62FFD970D5c92F527e8e863459430FEf3",          // DAOModuleImplementation
      USER_STATUS_MANAGER_ADDRESS: "0x4f0bE7965620a57019916D462a510ee314A77FBA", // UserStatusManager
      BRIDGE_MANAGER_ADDRESS: "0x5b68DeeB40fA5Fe3430432d6261f605f6A4190bA"       // BridgeManager
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
      STAKING_MODULE_ADDRESS: "0x...",
      DAO_MODULE_ADDRESS: "0x...",
      USER_STATUS_MANAGER_ADDRESS: "0x...",
      BRIDGE_MANAGER_ADDRESS: "0x..."
    }
  }
};

export default config.testnet;

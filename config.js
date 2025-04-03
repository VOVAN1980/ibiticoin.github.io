const config = {
  testnet: {
    networkName: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    explorerUrl: "https://testnet.bscscan.com",
    contracts: {
      IBITI_TOKEN_ADDRESS: "0xd2E16a09cD7B72ba6B74E40B8aA9d7C8A4c04B62",  // IBITIcoin
      FEE_MANAGER_ADDRESS: "0xbD47d0F55E0B670783e158D37adc572d1a5b7AEc",   // FeeManager
      NFTDiscount_ADDRESS: "0xaa2D809EBd56Bc91f4EcA369B069e0b97b548990",    // NFTDiscount
      IBITI_NFT_ADDRESS: "0x4019AB37AF8015812f1Ebea2936ffE4791bCE198",        // IBITINFT
      STAKING_MODULE_ADDRESS: "0xeC3FdBc6dae534Ebe3A6032030fbEDfB884Df384",     // StakingModule
      DAO_MODULE_ADDRESS: "0xb165F2eD8108679564070446c7aeDa1426b8Dacc",          // DAOModuleImplementation
      USER_STATUS_MANAGER_ADDRESS: "0xf0138B3a990041685CBd36Affb49D8398E990171", // UserStatusManager
      BRIDGE_MANAGER_ADDRESS: "0x293f3eE17FB694Ef9FCE46435cdfCA3d2F3E1951"       // BridgeManager
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

// config.js

const config = {
  testnet: {
    networkName: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    explorerUrl: "https://testnet.bscscan.com",
    contracts: {
      IBITI_TOKEN_ADDRESS: "0x1A4525946952Bb0d66A0fe722C01eEB970813923",  // IBITIcoin
      FEE_MANAGER_ADDRESS: "0x11820402B56097579450663265C8e524c84AaADA",   // FeeManager
      NFTDiscount_ADDRESS: "0x3B3FBE543d5f5F32d1ab99aB3CB650B484B836C9",     // NFTDiscount
      USER_STATUS_MANAGER_ADDRESS: "0x73f4AF9dc5E0739826214F39146c5619479685c9", // UserStatusManager
      ERC20_MOCK_ADDRESS: "0xE2a7C0eE308C74b7722E6E6e6C1Bf54Ea832E39E",       // ERC20Mock
      IBITINFT_ADDRESS: "0xDf298B0187B55c4249C4BD5Ee63b656197555d0f",         // IBITINFT
      IBITI_STAKING_ADDRESS: "0x8b6d526F335Acb00331663254cB325DA07797793",      // StakingModule
      DAOMODULE_ADDRESS: "0x039ed4E15d80D6Cddfb84385D44a00505D25c6F3",         // DAOModuleImplementation
      BRIDGE_MANAGER_ADDRESS: "0xbe94b2A4585bB8526aA7A0547D21D9a93560AcD7",      // BridgeManager
      IBITI_NFT_IMPL_ADDRESS: "0xDf298B0187B55c4249C4BD5Ee63b656197555d0f",      // IBITINFT (используем тот же адрес)
      TEAM_VESTING_ADDRESS: "0x1bb941b377821f5169D56ce048FE350BBf92b644"         // TeamVesting
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
      IBITINFT_ADDRESS: "0x...",
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

// Если переменная process.env.NODE_ENV не определена, можно выбрать нужный раздел, например "testnet".
export default config["testnet"];

// config.js

const config = {
  testnet: {
    networkName: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    explorerUrl: "https://testnet.bscscan.com",
    contracts: {
      IBITI_TOKEN_ADDRESS: "0xcADDCB8541f222b3Cd635e5789700Befc4437Bed",  // IBITIcoin
      FEE_MANAGER_ADDRESS: "0x358a8c03ECbe659B42BF88Ab6B9853971dA0A9dd",   // FeeManager
      NFTDiscount_ADDRESS: "0x58A2e9a323319EA9056b5826f83f2caC202C6917",     // NFTDiscount
      USER_STATUS_MANAGER_ADDRESS: "0xEe2102d4d0C68B7Db735456eccaE8D4A315Bf1A0", // UserStatusManager
      ERC20_MOCK_ADDRESS: "0x255aB3eC7Fb75cE360F0AC4392d2F5825B6F87FD",       // ERC20Mock
      IBITI_NFT_ADDRESS: "0x35b65240Cb6735Fc0458c4563f43F0C4464890A6",         // IBITINFT
      IBITI_STAKING_ADDRESS: "0x295fd16d48027CCb1e089ddFF09f7983200833F7",      // StakingModule
      DAOMODULE_ADDRESS: "0x4AFd9c948e99Ce085e9d92f01987FF4d2d6D8c00",         // DAOModuleImplementation
      BRIDGE_MANAGER_ADDRESS: "0xa7B2D69b993C1c0b18bd817DF80C510BD5da383C",      // BridgeManager
      IBITI_NFT_IMPL_ADDRESS: "",      // IBITINFT (используем тот же адрес)
      TEAM_VESTING_ADDRESS: "0x7a72825B92b31328e099186F50180BA4295ebc8b"         // TeamVesting
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

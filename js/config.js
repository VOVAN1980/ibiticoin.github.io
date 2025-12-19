const config = {
  testnet: {
    networkName: "BSC Testnet",
    chainId: 97,
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    explorerUrl: "https://testnet.bscscan.com",
    contracts: {
      // из .env
      PANCAKESWAP_ROUTER_ADDRESS=0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3
      USDT_TOKEN_ADDRESS_TESTNET=0x3ECc84DaEc5cA5973398C8AcA6FE5F40558aec84
      IBITI_TOKEN_ADDRESS=0xc230f9394875305ac83013C0186a400865bc8f86
      REFERRAL_SWAP_ROUTER:"0xb63779b7e19EB99B6E2F0668E68086fD0A0066FB", // REFERRAL_SWAP_ROUTER_ADDRESS_TESTNET
    }
  }
};

// сейчас тестим только testnet
config.active = config.testnet;

export default config;





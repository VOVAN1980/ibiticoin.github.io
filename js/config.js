testnet: {
  networkName: "BSC Testnet",
  chainId: 97,
  rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  explorerUrl: "https://testnet.bscscan.com",
  contracts: {
    USDT_TOKEN:          "0x1133CfB59D870B927ca204bc5567b48B448329Fc", // твой mUSDT18
    IBITI_TOKEN:         "0xc230f9394875305ac83013C0186a400865bc8f86",
    PANCAKESWAP_ROUTER:  "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",

    REFERRAL_SWAP_ROUTER: "0xF0cBFFC1a3F761771D2270d93A76124b4d1F1124",
  }
},
// и внизу
config.active = config.testnet;

export const nftSaleManagerAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_nftContract",
        type: "address"
      },
      {
        internalType: "address",
        name: "_ibitiToken",
        type: "address"
      },
      {
        internalType: "address",
        name: "_usdtToken",
        type: "address"
      },
      {
        internalType: "address",
        name: "_priceOracle",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "buyer",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "paidAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "paymentToken",
        type: "address"
      }
    ],
    name: "NFTPurchased",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "newOracle",
        type: "address"
      }
    ],
    name: "OracleUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "discountPercent",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "priceUSD",
        type: "uint256"
      }
    ],
    name: "PriceSet",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "discountPercent",
        type: "uint256"
      },
      {
        internalType: "string",
        name: "uri",
        type: "string"
      }
    ],
    name: "buyNFTWithIBITI",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "discountPercent",
        type: "uint256"
      },
      {
        internalType: "string",
        name: "uri",
        type: "string"
      }
    ],
    name: "buyNFTWithUSDT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "discountPercent",
        type: "uint256"
      }
    ],
    name: "getCurrentIBITIPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "discountPercent",
        type: "uint256"
      }
    ],
    name: "getCurrentUSDTPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "ibitiToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "nftContract",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    name: "nftPriceUSD",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "priceOracle",
    outputs: [
      {
        internalType: "contract IPriceOracle",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "discountPercent",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "priceUSD",
        type: "uint256"
      }
    ],
    name: "setNFTPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOracle",
        type: "address"
      }
    ],
    name: "updateOracle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "usdtToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
]

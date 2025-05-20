export const nftSaleManagerAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_nftDiscount",
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
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "discountPercent",
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
        internalType: "bool",
        name: "enabled",
        type: "bool"
      }
    ],
    name: "OracleToggled",
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
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "OwnershipTransferred",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "Paused",
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
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "Unpaused",
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
        internalType: "contract IERC20Metadata",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "nftDiscount",
    outputs: [
      {
        internalType: "contract NFTDiscount",
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
    name: "oracleEnabled",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
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
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
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
        internalType: "contract VolumeWeightedOracle",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "renounceOwnership",
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
        internalType: "bool",
        name: "_on",
        type: "bool"
      }
    ],
    name: "setOracleEnabled",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "unpause",
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
        internalType: "contract IERC20Metadata",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
]

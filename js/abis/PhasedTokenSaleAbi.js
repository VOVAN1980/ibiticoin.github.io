export const PhasedTokenSaleAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_ibiti",
        type: "address"
      },
      {
        internalType: "address",
        name: "_usdt",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_refReserve",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_volReserve",
        type: "uint256"
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
        indexed: true,
        internalType: "uint256",
        name: "phaseId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "ibitiAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "paidUSDT",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "address",
        name: "referrer",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bonusIBITI",
        type: "uint256"
      }
    ],
    name: "Bought",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "newPriceCents",
        type: "uint256"
      }
    ],
    name: "FallbackPriceUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "discountContract",
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
        internalType: "string",
        name: "baseURI",
        type: "string"
      }
    ],
    name: "JackpotAirdropConfigured",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address"
      }
    ],
    name: "JackpotAirdropped",
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
        indexed: true,
        internalType: "uint256",
        name: "phaseId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "start",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "end",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "priceCents",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "cap",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "whitelistOnly",
        type: "bool"
      }
    ],
    name: "PhaseAdded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "who",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "ReferralClaimed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "inviter",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "invitee",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "RewardPaid",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "RewardReserveSet",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "bonusId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "threshold",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "bonusPct",
        type: "uint16"
      }
    ],
    name: "VolumeBonusAdded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "threshold",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "pricePhase1",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "pricePhase2",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "pricePhase3",
        type: "uint256"
      }
    ],
    name: "VolumeDiscountUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "who",
        type: "address"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "ok",
        type: "bool"
      }
    ],
    name: "WhitelistSet",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "WithdrawnIBITI",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "WithdrawnUSDT",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "start",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "priceCents",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "cap",
        type: "uint256"
      },
      {
        internalType: "bool",
        name: "whitelistOnly",
        type: "bool"
      }
    ],
    name: "addPhase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "threshold",
        type: "uint256"
      },
      {
        internalType: "uint16",
        name: "bonusPct",
        type: "uint16"
      }
    ],
    name: "addVolumeBonus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "airdropBaseURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "airdropDiscountPercent",
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
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "airdropped",
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
    inputs: [
      {
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "referrer",
        type: "address"
      }
    ],
    name: "buy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "claimReferral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "discountContract",
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
    inputs: [],
    name: "discountThreshold",
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
    name: "discountedPricePhase1",
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
    name: "discountedPricePhase2",
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
    name: "discountedPricePhase3",
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
    name: "fallbackPrice",
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
    name: "ibiti",
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
    name: "ibitiDecimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "ibitiDenominator",
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
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    name: "phases",
    outputs: [
      {
        internalType: "uint256",
        name: "start",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "priceCents",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "cap",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "sold",
        type: "uint256"
      },
      {
        internalType: "bool",
        name: "whitelistOnly",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "refReserve",
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
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "referralRewards",
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
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "rewardAmount",
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
    name: "rewardTokens",
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
        name: "_priceCents",
        type: "uint256"
      }
    ],
    name: "setFallbackPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "contract NFTDiscount",
        name: "_discountContract",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_discountPercent",
        type: "uint256"
      },
      {
        internalType: "string",
        name: "_baseURI",
        type: "string"
      }
    ],
    name: "setJackpotAirdrop",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "setRewardReserve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "threshold",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "p1",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "p2",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "p3",
        type: "uint256"
      }
    ],
    name: "setVolumeDiscount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "who",
        type: "address"
      },
      {
        internalType: "bool",
        name: "ok",
        type: "bool"
      }
    ],
    name: "setWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "topUpVolumeReserve",
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
    name: "usdt",
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
    name: "usdtDecimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "usdtMultiplier",
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
    name: "volReserve",
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
        name: "",
        type: "uint256"
      }
    ],
    name: "volumeBonuses",
    outputs: [
      {
        internalType: "uint256",
        name: "threshold",
        type: "uint256"
      },
      {
        internalType: "uint16",
        name: "bonusPct",
        type: "uint16"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "whitelist",
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
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "withdrawIBITI",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "withdrawUSDT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
]

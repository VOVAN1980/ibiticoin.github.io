# IBITIcoin

IBITIcoin is a multi-module DeFi ecosystem built on **BNB Smart Chain (BEP-20)**.
The project combines a main token (`IBITI`), phased token sale, staking,
NFT discounts, dynamic fee manager and DAO module.

- Website: https://ibiticoin.com  
- Frontend (GitHub Pages): https://vovan1980.github.io/ibiticoin.github.io  
- Main token contract (BSC): `0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb`
- Decimals: `8`

> **Warning:** This repository is for developers and auditors.
> Nothing here is financial advice or an investment recommendation.

## Repositories

- **Smart contracts / core protocol**  
  `https://github.com/.../IBITIcoin-core` (контракты: `IBITIcoin.sol`,
  `PhasedTokenSale.sol`, `StakingModule.sol`, `NFTDiscount.sol`,
  `FeeManager.sol`, `DAOModule.sol`, `TeamVesting.sol` и др.)

- **Frontend & landing (this repo)**  
  Public website, shop, staking dashboard, NFT gallery
  and documentation pages (HTML/CSS/JS).

## Features (high level)

- **IBITI Token (BEP-20)**  
  - 8 decimals, deployed on BNB Smart Chain.  
  - Integrated with FeeManager, NFT discounts and staking.

- **Phased token sale**  
  - Multiple sale phases with fixed prices.  
  - Fallback sale mode after phases end. :contentReference[oaicite:1]{index=1}  

- **Staking module**  
  - Fixed-term staking (1–12 months) with increasing rewards.  
  - Penalties for early unstake, NFT rewards for long-term stakers.

- **NFT discounts**  
  - IBITI NFTs give fee/price discounts depending on rarity.  
  - Managed by `NFTDiscount` and `IBITINFT` contracts.

- **Dynamic fees (FeeManager)**  
  - Base buy/sell fees, activity tracking, volatility tiers and NFT discounts. :contentReference[oaicite:2]{index=2}  

- **DAO module**  
  - On-chain proposals, voting and optional NFT rewards for voters.

## Local development

### Prerequisites

- Node.js 18+
- npm or yarn
- `hardhat` and `pnpm` (optional)
- A BSC RPC endpoint (e.g. Ankr) and private key in `.env` file :contentReference[oaicite:3]{index=3}  

Example `.env` for contracts:

```bash
BSC_ARCHIVE_RPC_URL="https://..."
BSC_RPC_URL="https://data-seed-prebsc-1-s1.binance.org:8545/"
BSC_MAINNET_RPC_URL="https://bsc-dataseed1.bnbchain.org"
PRIVATE_KEY="0x..."
FOUNDER_WALLET="0x..."
BSCSCAN_API_KEY="..."
COINMARKETCAP_API_KEY="..."

Install & build (frontend)
# clone repo
git clone https://github.com/VOVAN1980/ibiticoin.github.io.git
cd ibitcoin.github.io

# static site – just open index.html via local server
npx serve .

Contracts (example)
cd contracts
npm install

# compile
npx hardhat compile

# run tests
npx hardhat test

# deploy to BSC testnet (example task)
npx hardhat run --network bscTestnet scripts/deploy_full.js

Security

See SECURITY.md
 for vulnerability disclosure and testing guidelines.

License

Code is licensed under the MIT License – see LICENSE
.

Brand, logo, token symbol and NFTs are governed by
LICENSE_TECHNOLOGY.md
 and LICENSE_OVERVIEW.md

# Contributing to IBITIcoin

Thank you for your interest in contributing!

This document explains how to contribute code, documentation or bug reports
to the IBITIcoin ecosystem.

## 1. Ways to contribute

- **Bug reports** (contracts, frontend, docs)
- **Feature requests** and design proposals
- **Pull requests** with:
  - bug fixes,
  - tests,
  - documentation or UI improvements.

Before opening a new Issue, please check that a similar Issue
does not already exist.

## 2. Development setup

1. Fork the repository on GitHub.
2. Clone your fork and create a new branch:

   ```bash
   git checkout -b feature/my-change

npm install
npx hardhat test

For frontend changes, run a local static server and open index.html
in a browser.

3. Coding style

Solidity:

Follow existing style in the repository.

Use SPDX license identifiers and pragma versions consistent with the project.

JavaScript:

Use modern ES modules where possible.

Keep functions small and well-named.

4. Commit messages

Use clear, descriptive commit messages, e.g.:

fix: handle staking early-unlock penalty

feat: add NFT discount tooltip to shop

docs: update token sale info

5. Pull Request process

Make sure your branch is up to date with main.

Run tests and linters (if available).

Open a Pull Request describing:

what problem it solves,

how it was implemented,

any risks or breaking changes.

By submitting a Pull Request, you agree that your contribution is licensed
under the MIT License of this repository.

See LICENSE for details.


---

## 9. `GOVERNANCE.md`

Здесь описываем, как принимаются решения по релизам/апдейтам, пока DAO ещё не в бою.

```markdown
# IBITIcoin Governance

This document describes how changes to the IBITIcoin protocol, smart contracts
and public frontends are governed at the current stage of the project.

## 1. Current model

For now, IBITIcoin uses a **founder-led governance** model with the following components:

- **Founder / core maintainer** – controls:
  - ownership of main contracts (where not renounced),
  - deployment of upgrades and new modules,
  - DNS / hosting for official websites.

- **Multisig / DAO (planned)** – on-chain voting module implemented
  via the `DAOModule` and related contracts. Activation and migration
  to full DAO governance are planned for a later phase.

## 2. Smart contracts

- Contracts with `Ownable` are currently owned by a founder address
  or a controlled multisig.
- Over time, ownership may be:
  - transferred to a DAO contract,
  - renounced (where appropriate),
  - or kept under multisig for security-critical modules (bridges, fee manager, etc.).

Changes to core parameters (fees, sale phases, staking terms) are proposed
and executed by the core team following internal review and, when relevant,
community discussion.

## 3. Frontend

- The official frontend (`ibiticoin.com` and GitHub Pages mirror)
  is maintained by the core team.
- Third-party frontends are allowed (see `LICENSE_TECHNOLOGY.md`),
  but they are not considered “official” unless explicitly announced.

## 4. Community input

Community feedback is welcome via:

- GitHub Issues and Pull Requests,
- official Telegram / Discord channels,
- governance proposals once the DAO module is active.

While final decisions currently remain with the core team, we aim to:

- publish clear changelogs,
- announce important parameter changes in advance,
- gradually move more control on-chain.

## 5. Future roadmap

Planned governance milestones:

1. Deploy and test the DAO contracts on testnet.
2. Migrate selected parameters (e.g. fee settings, buyback strategy)
   under DAO control.
3. Introduce on-chain voting for major upgrades (new modules, bridges).
4. Explore establishing a formal foundation or legal entity, if needed.

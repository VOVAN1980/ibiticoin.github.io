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

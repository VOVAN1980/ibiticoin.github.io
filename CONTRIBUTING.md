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


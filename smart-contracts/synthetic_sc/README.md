# 🚀 synthetic_sc: Synthetics Protocol on Solana

![Anchor](https://img.shields.io/badge/Built%20With-Anchor-blueviolet?style=flat-square)
![Solana](https://img.shields.io/badge/Chain-Solana-3a3a3a?logo=solana&style=flat-square)

Welcome to **synthetic_sc** – a blazing fast, user-friendly synthetic asset protocol built with [Anchor](https://book.anchor-lang.com/) for Solana! Mint synthetic Tesla (sTSLA) tokens instantly by depositing USDC as collateral. No more multi-step UX. One click, one transaction, instant sTSLA. ⚡️

---

## 🗂️ Project Structure
- `programs/` — Rust smart contract source code
- `tests/` — TypeScript integration tests
- `migrations/` — Deployment scripts
- `package.json` — JS/TS dependencies for testing
- `Anchor.toml` — Anchor configuration

---

## ⚡ Quickstart
```bash
yarn install         # Install JS/TS dependencies
anchor build         # Build the Solana program
anchor test          # Run the test suite
```

---

## 🌊 User Flow (Latest)

```mermaid
flowchart TD
    A[User calls deposit_collateral] --> B[USDC transferred to vault]
    B --> C[Contract calculates max sTSLA (150% collateralization)]
    C --> D[sTSLA instantly minted to user]
    D --> E[Events emitted: CollateralDeposited, sTeslaMinted]
```

- **Single-step UX:** Users deposit USDC and receive sTSLA in one atomic transaction.
- **No more manual minting:** The protocol calculates and mints the max allowable sTSLA for you.
- **150% Collateralization:** For every 1.5 USDC, you can mint 1 sTSLA (i.e., up to 2/3 of your collateral value).

---

## 📣 Events

| Event                | Description                                      |
|----------------------|--------------------------------------------------|
| `CollateralDeposited`| Emitted when a user deposits USDC as collateral. |
| `sTeslaMinted`       | Emitted when sTSLA is minted for a user.         |

Both events include the user's address and the amount involved.

---

## 📝 Notes
- The contract enforces a 150% collateralization ratio for safety.
- The new flow is atomic, gas-efficient, and user-centric.
- Built with Anchor for reliability and security.

---

## 🤝 Contributing
We 💜 contributions! Open an issue, submit a PR, or suggest features. For major changes, please open an issue first to discuss what you'd like to change.

---

## 🌐 Community & Support
- [Anchor Discord](https://discord.gg/6h6VqztuCu)
- [Solana Stack Exchange](https://solana.stackexchange.com/)
- Or open an issue in this repo!

---

Happy minting! 🦄 
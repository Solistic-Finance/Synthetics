# synthetic_sc

This is the main workspace for the Synthetics smart contract, built with Anchor for Solana.

## Structure
- **programs/**: Rust source code for the smart contract.
- **tests/**: TypeScript tests for the contract.
- **migrations/**: Deployment scripts.
- **package.json**: JS/TS dependencies for testing and scripts.
- **Anchor.toml**: Anchor configuration.

## Usage
Install dependencies and use Anchor CLI for building, testing, and deploying. 

```
yarn install
anchor build
anchor test
```

## User Flow (as of latest update)
- Users call a single `deposit_collateral` instruction to deposit USDC as collateral.
- The contract automatically calculates the maximum amount of sTSLA that can be minted (using a 150% collateralization ratio) and mints it to the user's account in the same transaction.
- There is no longer a need to call a separate mint instruction for sTSLA.

## Events
- **CollateralDeposited**: Emitted when a user deposits collateral.
- **sTeslaMinted**: Emitted when sTSLA is minted for a user after deposit. Contains the user's address and the amount minted.

## Notes
- The contract enforces a 150% collateralization ratio (i.e., users can mint sTSLA up to 2/3 of their USDC collateral value).
- The new flow improves UX by making the process atomic and seamless for users. 
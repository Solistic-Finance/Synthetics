# Synthetic SC Test Suite

This directory contains test cases for the Synthetics Protocol's smart contracts.

## Test Structure

The test suite uses the following structure:

1. **Setup and Initialization**
   - Setup test accounts and token mints
   - Initialize vault and token accounts

2. **Deposit Collateral Tests**
   - Test basic deposit functionality
   - Test incremental deposits
   - Test minting of synthetic assets based on collateral
   - Test error conditions (invalid inputs, etc.)

## Running Tests

### Prerequisites

- Node.js (>= 14.x)
- Anchor Framework
- Solana Test Validator

### Commands

```bash
# Install dependencies
npm install

# Build the program
npm run build

# Run tests
npm test
```

## Test Cases

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Initialize vault | Creates the vault account and associated token accounts | Vault created with correct data |
| Deposit collateral | Deposit USDC collateral and mint sTSLA tokens | Correct amount of tokens minted, balances updated |
| Multiple deposits | Add more collateral to an existing position | Additional sTSLA tokens minted proportionally |
| Invalid deposit | Try to deposit from an invalid token account | Transaction fails with appropriate error |

## Notes

- Tests use local Solana test validator
- All accounts and mints are created fresh for each test run
- Collateralization ratio is set to 150% in the contract 
# Blockchain Services

This module contains services for interacting with the Synthetic Tesla (sTesla) smart contracts on Solana.

## Services

### BlockchainConfigService

Manages the connection to the Solana blockchain and provides the Anchor Program instance for interacting with the smart contracts.

### CollateralBalanceService

Tracks collateral balances for users and the total collateral in the vault.

- `getUserCollateralBalance(userPublicKey)`: Get the collateral balance for a specific user
- `getTotalCollateralBalance()`: Get the total collateral in the vault
- `getAllUserCollateralAccounts()`: Get all user collateral accounts with their deposited and minted amounts

### STeslaBalanceService

Tracks synthetic Tesla (sTesla) token balances for users and total supply.

- `getUserSTeslaBalance(userPublicKey)`: Get the sTesla balance for a specific user
- `getTotalSTeslaSupply()`: Get the total sTesla supply across all users
- `getUserCollateralizationRatio(userPublicKey)`: Get collateralization ratio for a user

### ContractEventListenerService

Listens for events emitted by the smart contracts and processes them.

- `startEventListeners()`: Start listening to contract events
- `stopEventListeners()`: Stop listening to contract events
- `processCollateralDepositedEvent(user, amount)`: Process a CollateralDeposited event
- `processSTeslaMintedEvent(user, amount)`: Process a sTeslaMinted event

### RiskEngineService

Manages risk parameters, health factors, and liquidation calculations for the synthetic assets.

- `calculateUserHealthFactor(userPublicKey)`: Calculate the health factor for a user's position
- `canMintAdditionalSynthetics(userPublicKey, amount)`: Check if a user can mint additional synthetic assets
- `findLiquidatableAccounts()`: Find accounts that are eligible for liquidation
- `calculateLiquidationAmounts(userPublicKey)`: Calculate liquidation amounts for a specific user
- `getRiskParameters()`: Get current risk parameters
- `updateRiskParameters(newParams)`: Update risk parameters (admin function)

## Usage

These services are provided through the BlockchainModule. To use them in another module, import the BlockchainModule:

```typescript
import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  // ...
})
export class YourModule {}
```

Then inject the services as needed:

```typescript
import { Injectable } from '@nestjs/common';
import { CollateralBalanceService } from '../blockchain/services/collateral-balance.service';
import { RiskEngineService } from '../blockchain/services/risk-engine.service';

@Injectable()
export class YourService {
  constructor(
    private readonly collateralBalanceService: CollateralBalanceService,
    private readonly riskEngineService: RiskEngineService,
  ) {}

  async someMethod() {
    const totalCollateral = await this.collateralBalanceService.getTotalCollateralBalance();
    const riskParams = this.riskEngineService.getRiskParameters();
    // ...
  }
}
```

## Configuration

Update the `BlockchainConfigService` with the correct network endpoints and program IDs for your deployment environment. 
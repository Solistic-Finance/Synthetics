/**
 * Risk parameters for the synthetic assets
 */
export interface RiskParameters {
  minimumCollateralRatio: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
  protocolFeePercentage: number;
}

/**
 * User health factor details
 */
export interface UserHealthFactor {
  userPublicKey: string;
  collateralAmount: number;
  syntheticsAmount: number;
  collateralValueUSD: number;
  syntheticsValueUSD: number;
  currentRatio: number;
  healthFactor: number;
  isLiquidatable: boolean;
}

/**
 * Liquidation calculation result
 */
export interface LiquidationAmounts {
  collateralToSeize: number;
  syntheticsToRepay: number;
  collateralToSeizeUSD: number;
  syntheticsToRepayUSD: number;
  liquidationBonus: number;
}

/**
 * Result of checking if a user can mint additional synthetics
 */
export interface MintEligibilityResult {
  canMint: boolean;
  requiredCollateral: number;
  reason?: string;
}

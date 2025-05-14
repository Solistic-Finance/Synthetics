import { Injectable, OnModuleInit } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { BlockchainConfigService } from './blockchain-config.service';
import { CollateralBalanceService } from './collateral-balance.service';
import { STeslaBalanceService } from './stesla-balance.service';
import {
  RiskParameters,
  UserHealthFactor,
  LiquidationAmounts,
  MintEligibilityResult,
} from '../interfaces/risk-engine.interface';

@Injectable()
export class RiskEngineService implements OnModuleInit {
  // Default risk parameters
  private riskParams: RiskParameters = {
    minimumCollateralRatio: 1.5, // 150% minimum collateralization ratio
    liquidationThreshold: 1.25, // 125% liquidation threshold
    liquidationPenalty: 0.1, // 10% liquidation penalty
    protocolFeePercentage: 0.005, // 0.5% protocol fee
  };

  // External price feeds (would come from oracles in production)
  private solUsdPrice = 150; // Mock price, would be fetched from oracle
  private teslaUsdPrice = 800; // Mock price, would be fetched from oracle

  constructor(
    private readonly blockchainConfigService: BlockchainConfigService,
    private readonly collateralBalanceService: CollateralBalanceService,
    private readonly sTeslaBalanceService: STeslaBalanceService,
  ) {}

  async onModuleInit() {
    // Initialize price feeds or other dependencies
    await this.updatePriceFeeds();

    // Set up a regular update interval for prices
    setInterval(() => this.updatePriceFeeds(), 60000); // Update every minute
  }

  /**
   * Update price feeds from oracles
   */
  private async updatePriceFeeds(): Promise<void> {
    try {
      // In a real implementation, you would fetch prices from oracles
      // This is a placeholder implementation

      // Example: fetch SOL price from an oracle
      // this.solUsdPrice = await someOracleService.getPrice('SOL/USD');

      // Example: fetch Tesla stock price from an oracle
      // this.teslaUsdPrice = await someOracleService.getPrice('TSLA/USD');

      console.log(
        `Updated prices - SOL: $${this.solUsdPrice}, Tesla: $${this.teslaUsdPrice}`,
      );
    } catch (error) {
      console.error('Error updating price feeds:', error);
    }
  }

  /**
   * Get current risk parameters
   */
  getRiskParameters(): RiskParameters {
    return { ...this.riskParams };
  }

  /**
   * Update risk parameters (admin function)
   */
  updateRiskParameters(newParams: Partial<RiskParameters>): void {
    this.riskParams = { ...this.riskParams, ...newParams };
    console.log('Risk parameters updated:', this.riskParams);
  }

  /**
   * Get the SOL price in USD
   */
  getSolUsdPrice(): number {
    return this.solUsdPrice;
  }

  /**
   * Get the Tesla stock price in USD
   */
  getTeslaUsdPrice(): number {
    return this.teslaUsdPrice;
  }

  /**
   * Calculate the health factor for a user
   * Health factor < 1 means the position is liquidatable
   */
  async calculateUserHealthFactor(
    userPublicKey: PublicKey,
  ): Promise<UserHealthFactor> {
    try {
      // Get user's collateral and synthetic balances
      const collateralAmount =
        await this.collateralBalanceService.getUserCollateralBalance(
          userPublicKey,
        );
      const syntheticsAmount =
        await this.sTeslaBalanceService.getUserSTeslaBalance(userPublicKey);

      // Calculate USD values
      const collateralValueUSD = collateralAmount * this.solUsdPrice;
      const syntheticsValueUSD = syntheticsAmount * this.teslaUsdPrice;

      // Calculate current collateralization ratio
      const currentRatio =
        syntheticsValueUSD > 0
          ? collateralValueUSD / syntheticsValueUSD
          : Number.POSITIVE_INFINITY;

      // Calculate health factor (1.0 is the liquidation point)
      const healthFactor = currentRatio / this.riskParams.liquidationThreshold;

      // Determine if position is liquidatable
      const isLiquidatable =
        currentRatio < this.riskParams.liquidationThreshold;

      return {
        userPublicKey: userPublicKey.toString(),
        collateralAmount,
        syntheticsAmount,
        collateralValueUSD,
        syntheticsValueUSD,
        currentRatio,
        healthFactor,
        isLiquidatable,
      };
    } catch (error) {
      console.error('Error calculating user health factor:', error);
      throw error;
    }
  }

  /**
   * Check if a user can mint additional synthetic assets
   */
  async canMintAdditionalSynthetics(
    userPublicKey: PublicKey,
    additionalSyntheticsAmount: number,
  ): Promise<MintEligibilityResult> {
    try {
      // Get user's current position
      const collateralAmount =
        await this.collateralBalanceService.getUserCollateralBalance(
          userPublicKey,
        );
      const currentSyntheticsAmount =
        await this.sTeslaBalanceService.getUserSTeslaBalance(userPublicKey);

      // Calculate USD values
      const collateralValueUSD = collateralAmount * this.solUsdPrice;
      const currentSyntheticsValueUSD =
        currentSyntheticsAmount * this.teslaUsdPrice;
      const additionalSyntheticsValueUSD =
        additionalSyntheticsAmount * this.teslaUsdPrice;
      const totalSyntheticsValueUSD =
        currentSyntheticsValueUSD + additionalSyntheticsValueUSD;

      // Calculate required collateral value based on minimum ratio
      const requiredCollateralValueUSD =
        totalSyntheticsValueUSD * this.riskParams.minimumCollateralRatio;
      const requiredCollateralAmount =
        requiredCollateralValueUSD / this.solUsdPrice;
      const additionalCollateralNeeded = Math.max(
        0,
        requiredCollateralAmount - collateralAmount,
      );

      // Check if user has enough collateral
      const hasEnoughCollateral =
        collateralValueUSD >= requiredCollateralValueUSD;

      return {
        canMint: hasEnoughCollateral,
        requiredCollateral: additionalCollateralNeeded,
        reason: hasEnoughCollateral
          ? undefined
          : 'Insufficient collateral for the requested mint amount',
      };
    } catch (error) {
      console.error(
        'Error checking if user can mint additional synthetics:',
        error,
      );
      throw error;
    }
  }

  /**
   * Identify accounts that are eligible for liquidation
   */
  async findLiquidatableAccounts(): Promise<UserHealthFactor[]> {
    try {
      // Get all user collateral accounts
      const accounts =
        await this.collateralBalanceService.getAllUserCollateralAccounts();

      // Check health factor for each account
      const liquidatableAccounts: UserHealthFactor[] = [];

      for (const account of accounts) {
        const userPublicKey = account.publicKey;
        const healthFactor = await this.calculateUserHealthFactor(
          userPublicKey,
        );

        if (healthFactor.isLiquidatable) {
          liquidatableAccounts.push(healthFactor);
        }
      }

      return liquidatableAccounts;
    } catch (error) {
      console.error('Error finding liquidatable accounts:', error);
      return [];
    }
  }

  /**
   * Calculate liquidation amounts for a specific user
   */
  async calculateLiquidationAmounts(
    userPublicKey: PublicKey,
  ): Promise<LiquidationAmounts | null> {
    try {
      // Get user's health factor
      const healthFactor = await this.calculateUserHealthFactor(userPublicKey);

      // If not liquidatable, return null
      if (!healthFactor.isLiquidatable) {
        return null;
      }

      // Calculate amount of synthetics to liquidate (50% of the position)
      const syntheticsToRepay = healthFactor.syntheticsAmount * 0.5;
      const syntheticsToRepayUSD = syntheticsToRepay * this.teslaUsdPrice;

      // Calculate collateral to seize including liquidation penalty
      const baseCollateralToSeize = syntheticsToRepayUSD / this.solUsdPrice;
      const liquidationBonus =
        baseCollateralToSeize * this.riskParams.liquidationPenalty;
      const collateralToSeize = baseCollateralToSeize + liquidationBonus;
      const collateralToSeizeUSD = collateralToSeize * this.solUsdPrice;

      return {
        collateralToSeize,
        syntheticsToRepay,
        collateralToSeizeUSD,
        syntheticsToRepayUSD,
        liquidationBonus,
      };
    } catch (error) {
      console.error('Error calculating liquidation amounts:', error);
      return null;
    }
  }

  /**
   * Calculate the protocol fee for a transaction
   */
  calculateProtocolFee(transactionAmountUSD: number): number {
    return transactionAmountUSD * this.riskParams.protocolFeePercentage;
  }
}

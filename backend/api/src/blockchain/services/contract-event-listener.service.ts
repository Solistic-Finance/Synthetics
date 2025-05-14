import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { BlockchainConfigService } from './blockchain-config.service';
import * as anchor from '@project-serum/anchor';
import { CollateralBalanceService } from './collateral-balance.service';
import { STeslaBalanceService } from './stesla-balance.service';
import { RiskEngineService } from './risk-engine.service';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class ContractEventListenerService
  implements OnModuleInit, OnModuleDestroy
{
  private eventSubscriptionId: number | null = null;
  private riskCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly blockchainConfigService: BlockchainConfigService,
    private readonly collateralBalanceService: CollateralBalanceService,
    private readonly sTeslaBalanceService: STeslaBalanceService,
    private readonly riskEngineService: RiskEngineService,
  ) {}

  /**
   * Start listening for events when the module initializes
   */
  async onModuleInit() {
    await this.startEventListeners();
    this.startRiskMonitoring();
  }

  /**
   * Clean up subscriptions when the module is destroyed
   */
  async onModuleDestroy() {
    await this.stopEventListeners();
    this.stopRiskMonitoring();
  }

  /**
   * Start listening to contract events
   */
  async startEventListeners() {
    try {
      const connection = this.blockchainConfigService.getConnection();
      const program = this.blockchainConfigService.getProgram();

      // Subscribe to program account changes
      this.eventSubscriptionId = connection.onProgramAccountChange(
        program.programId,
        async (accountInfo) => {
          try {
            // Parse the account data
            const accountData = program.coder.accounts.decode(
              'userCollateralAccount',
              accountInfo.accountInfo.data,
            );

            // Log the event data
            console.log('Account update detected:', {
              pubkey: accountInfo.accountId.toString(),
              owner: accountData.owner.toString(),
              depositedAmount: accountData.depositedAmount.toString(),
              mintedAmount: accountData.mintedAmount.toString(),
              lastDepositTs: accountData.lastDepositTs.toString(),
            });

            // Check user position health after account update
            await this.checkUserPositionHealth(
              new PublicKey(accountData.owner.toString()),
            );
          } catch (error) {
            // This might be another type of account that we're not interested in
            // or an error in decoding
            console.error('Error processing account change:', error);
          }
        },
        'confirmed',
      );

      // Listen for CollateralDeposited event logs
      connection.onLogs(program.programId, (logs) => {
        if (logs.logs.some((log) => log.includes('CollateralDeposited'))) {
          console.log('CollateralDeposited event detected');
          console.log('Logs:', logs.logs);

          // Extract user and amount from logs (simplified example)
          // In a real implementation, you'd need to parse the event data properly
          const userLog = logs.logs.find((log) => log.includes('owner:'));
          const amountLog = logs.logs.find((log) => log.includes('amount:'));

          if (userLog && amountLog) {
            const userMatch = userLog.match(/owner: ([A-Za-z0-9]+)/);
            const amountMatch = amountLog.match(/amount: (\d+)/);

            if (userMatch && amountMatch) {
              const user = userMatch[1];
              const amount = amountMatch[1];
              this.processCollateralDepositedEvent(user, amount);
            }
          }
        }
      });

      // Listen for sTeslaMinted event logs
      connection.onLogs(program.programId, (logs) => {
        if (logs.logs.some((log) => log.includes('sTeslaMinted'))) {
          console.log('sTeslaMinted event detected');
          console.log('Logs:', logs.logs);

          // Extract user and amount from logs (simplified example)
          // In a real implementation, you'd need to parse the event data properly
          const userLog = logs.logs.find((log) => log.includes('owner:'));
          const amountLog = logs.logs.find((log) => log.includes('amount:'));

          if (userLog && amountLog) {
            const userMatch = userLog.match(/owner: ([A-Za-z0-9]+)/);
            const amountMatch = amountLog.match(/amount: (\d+)/);

            if (userMatch && amountMatch) {
              const user = userMatch[1];
              const amount = amountMatch[1];
              this.processSTeslaMintedEvent(user, amount);
            }
          }
        }
      });

      console.log('Event listeners started successfully');
    } catch (error) {
      console.error('Error starting event listeners:', error);
    }
  }

  /**
   * Stop listening to contract events
   */
  async stopEventListeners() {
    try {
      if (this.eventSubscriptionId !== null) {
        const connection = this.blockchainConfigService.getConnection();
        await connection.removeProgramAccountChangeListener(
          this.eventSubscriptionId,
        );
        this.eventSubscriptionId = null;
        console.log('Event listeners stopped successfully');
      }
    } catch (error) {
      console.error('Error stopping event listeners:', error);
    }
  }

  /**
   * Start periodic risk monitoring for all accounts
   */
  private startRiskMonitoring() {
    // Check for liquidatable positions every 5 minutes
    this.riskCheckInterval = setInterval(async () => {
      try {
        console.log('Performing periodic risk check...');

        // Find all accounts that need liquidation
        const liquidatableAccounts =
          await this.riskEngineService.findLiquidatableAccounts();

        if (liquidatableAccounts.length > 0) {
          console.log(
            `Found ${liquidatableAccounts.length} accounts eligible for liquidation`,
          );

          // In a real system, you would trigger notifications or automated liquidations here
          for (const account of liquidatableAccounts) {
            console.log(`Account ${account.userPublicKey} is liquidatable:`, {
              collateralValueUSD: account.collateralValueUSD,
              syntheticsValueUSD: account.syntheticsValueUSD,
              currentRatio: account.currentRatio,
              healthFactor: account.healthFactor,
            });

            // Calculate liquidation amounts
            const liquidationInfo =
              await this.riskEngineService.calculateLiquidationAmounts(
                new PublicKey(account.userPublicKey),
              );

            if (liquidationInfo) {
              console.log('Liquidation details:', liquidationInfo);
            }
          }
        } else {
          console.log('No accounts eligible for liquidation');
        }
      } catch (error) {
        console.error('Error during periodic risk check:', error);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Stop risk monitoring
   */
  private stopRiskMonitoring() {
    if (this.riskCheckInterval) {
      clearInterval(this.riskCheckInterval);
      this.riskCheckInterval = null;
      console.log('Risk monitoring stopped');
    }
  }

  /**
   * Check a specific user's position health after changes
   */
  private async checkUserPositionHealth(userPublicKey: PublicKey) {
    try {
      const healthFactor =
        await this.riskEngineService.calculateUserHealthFactor(userPublicKey);

      console.log(`User ${userPublicKey.toString()} position health:`, {
        collateralValueUSD: healthFactor.collateralValueUSD,
        syntheticsValueUSD: healthFactor.syntheticsValueUSD,
        currentRatio: healthFactor.currentRatio.toFixed(2),
        healthFactor: healthFactor.healthFactor.toFixed(2),
      });

      // Warn if position is close to liquidation threshold (health factor < 1.2)
      if (healthFactor.healthFactor < 1.2 && healthFactor.healthFactor >= 1.0) {
        console.warn(
          `WARNING: User ${userPublicKey.toString()} position is at risk of liquidation!`,
        );

        // In a real application, you would send notifications to the user
        // and potentially other interested parties
      }

      // Alert if position is eligible for liquidation
      if (healthFactor.isLiquidatable) {
        console.warn(
          `ALERT: User ${userPublicKey.toString()} position is eligible for liquidation!`,
        );

        // Calculate liquidation amounts
        const liquidationInfo =
          await this.riskEngineService.calculateLiquidationAmounts(
            userPublicKey,
          );

        if (liquidationInfo) {
          console.log('Liquidation details:', liquidationInfo);
          // In a production system, you might trigger an automated liquidation or notify liquidators
        }
      }
    } catch (error) {
      console.error(
        `Error checking position health for user ${userPublicKey.toString()}:`,
        error,
      );
    }
  }

  /**
   * Process a CollateralDeposited event
   * This could be called manually or from the event listener
   */
  async processCollateralDepositedEvent(user: string, amount: string) {
    try {
      console.log(
        `Processing CollateralDeposited event: User ${user} deposited ${amount}`,
      );

      // Update any in-memory caches or call other services
      // In a real implementation, you might update a database record

      // Check user position health after deposit
      await this.checkUserPositionHealth(new PublicKey(user));
    } catch (error) {
      console.error('Error processing CollateralDeposited event:', error);
    }
  }

  /**
   * Process a sTeslaMinted event
   * This could be called manually or from the event listener
   */
  async processSTeslaMintedEvent(user: string, amount: string) {
    try {
      console.log(
        `Processing sTeslaMinted event: User ${user} minted ${amount} sTesla`,
      );

      // Update any in-memory caches or call other services
      // In a real implementation, you might update a database record

      // Check user position health after minting
      await this.checkUserPositionHealth(new PublicKey(user));
    } catch (error) {
      console.error('Error processing sTeslaMinted event:', error);
    }
  }
}

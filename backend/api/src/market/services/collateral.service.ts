import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollateralRatio } from '../entities/collateral-ratio.entity';
import { RiskEngineService } from '../../blockchain/services/risk-engine.service';
import { Interval } from '@nestjs/schedule';
import { PublicKey } from '@solana/web3.js';
import { CollateralBalanceService } from '../../blockchain/services/collateral-balance.service';
import { STeslaBalanceService } from '../../blockchain/services/stesla-balance.service';

@Injectable()
export class CollateralService {
  private readonly logger = new Logger(CollateralService.name);

  constructor(
    @InjectRepository(CollateralRatio)
    private collateralRatioRepository: Repository<CollateralRatio>,
    private readonly riskEngineService: RiskEngineService,
    private readonly collateralBalanceService: CollateralBalanceService,
    private readonly sTeslaBalanceService: STeslaBalanceService,
  ) {}

  async getUserCollateralRatio(userAddress: string): Promise<CollateralRatio> {
    try {
      return await this.collateralRatioRepository.findOne({
        where: { userAddress },
        order: { timestamp: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Error getting collateral ratio for user ${userAddress}: ${error.message}`,
      );
      throw error;
    }
  }

  async getCollateralRatioHistory(
    userAddress: string,
    from: Date,
    to: Date,
  ): Promise<CollateralRatio[]> {
    try {
      return await this.collateralRatioRepository.find({
        where: {
          userAddress,
          timestamp: {
            $gte: from,
            $lte: to,
          } as any,
        },
        order: { timestamp: 'ASC' },
      });
    } catch (error) {
      this.logger.error(
        `Error getting collateral ratio history for user ${userAddress}: ${error.message}`,
      );
      throw error;
    }
  }

  @Interval(300000) // Update every 5 minutes
  async updateCollateralRatiosForActiveUsers() {
    try {
      // In a real-world scenario, we would fetch active users from a database or event log
      // For now, we'll use a hardcoded list of example users
      const activeUsers = await this.getActiveUsers();

      for (const user of activeUsers) {
        await this.updateUserCollateralRatio(user);
      }

      this.logger.log(
        `Updated collateral ratios for ${activeUsers.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Error in collateral ratio batch update: ${error.message}`,
      );
    }
  }

  private async getActiveUsers(): Promise<string[]> {
    // In a real implementation, this would query the database or blockchain for active users
    // Returning mock data for now
    return [
      'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
      '5YNmX8xXkDD3PzCYD9MGHK1xg6np56iZgGNBJLBFQVTL',
      '7nV4HAHtSJxJjXQMsZ9vWkXDMqN5xUXYTmJBbSk7AvuE',
    ];
  }

  private async updateUserCollateralRatio(userAddress: string) {
    try {
      const publicKey = new PublicKey(userAddress);

      // Get collateral balance
      const collateralAmount =
        await this.collateralBalanceService.getUserCollateralBalance(publicKey);

      // Get synthetic token balance
      const syntheticAmount =
        await this.sTeslaBalanceService.getUserSTeslaBalance(publicKey);

      // Calculate ratio
      const ratio =
        syntheticAmount > 0
          ? collateralAmount / syntheticAmount
          : Number.POSITIVE_INFINITY;

      // Create new collateral ratio record
      const collateralRatio = new CollateralRatio();
      collateralRatio.userAddress = userAddress;
      collateralRatio.symbolPair = 'SOL/sTSLA';
      collateralRatio.ratio = ratio;
      collateralRatio.collateralAmount = collateralAmount;
      collateralRatio.syntheticAmount = syntheticAmount;

      await this.collateralRatioRepository.save(collateralRatio);

      this.logger.log(`Updated collateral ratio for ${userAddress}: ${ratio}`);
    } catch (error) {
      this.logger.error(
        `Error updating collateral ratio for ${userAddress}: ${error.message}`,
      );
    }
  }
}

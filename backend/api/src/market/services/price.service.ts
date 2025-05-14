import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceHistory } from '../entities/price-history.entity';
import { STeslaBalanceService } from '../../blockchain/services/stesla-balance.service';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);

  constructor(
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
    private readonly sTeslaService: STeslaBalanceService,
  ) {}

  async getLatestPrice(symbol: string): Promise<PriceHistory> {
    try {
      return await this.priceHistoryRepository.findOne({
        where: { symbol },
        order: { timestamp: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Error getting latest price for ${symbol}: ${error.message}`,
      );
      throw error;
    }
  }

  async getPriceHistory(
    symbol: string,
    from: Date,
    to: Date,
  ): Promise<PriceHistory[]> {
    try {
      return await this.priceHistoryRepository.find({
        where: {
          symbol,
          timestamp: {
            $gte: from,
            $lte: to,
          } as any,
        },
        order: { timestamp: 'ASC' },
      });
    } catch (error) {
      this.logger.error(
        `Error getting price history for ${symbol}: ${error.message}`,
      );
      throw error;
    }
  }

  @Interval(60000) // Update price every minute
  async updateSTeslaPriceFromChain() {
    try {
      const price = await this.sTeslaService.getCurrentPrice();

      const priceHistory = new PriceHistory();
      priceHistory.symbol = 'sTSLA';
      priceHistory.price = price;

      await this.priceHistoryRepository.save(priceHistory);
      this.logger.log(`Updated sTSLA price: ${price}`);
    } catch (error) {
      this.logger.error(`Error updating sTSLA price: ${error.message}`);
    }
  }
}

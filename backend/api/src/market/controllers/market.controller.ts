import { Controller, Get, Param, Query } from '@nestjs/common';
import { PriceService } from '../services/price.service';
import { CollateralService } from '../services/collateral.service';
import { PriceHistory } from '../entities/price-history.entity';
import { CollateralRatio } from '../entities/collateral-ratio.entity';

@Controller('market')
export class MarketController {
  constructor(
    private readonly priceService: PriceService,
    private readonly collateralService: CollateralService,
  ) {}

  @Get('price/:symbol')
  async getLatestPrice(@Param('symbol') symbol: string): Promise<PriceHistory> {
    return this.priceService.getLatestPrice(symbol);
  }

  @Get('price/:symbol/history')
  async getPriceHistory(
    @Param('symbol') symbol: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<PriceHistory[]> {
    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    const toDate = to ? new Date(to) : new Date();

    return this.priceService.getPriceHistory(symbol, fromDate, toDate);
  }

  @Get('collateral/:address')
  async getUserCollateralRatio(
    @Param('address') address: string,
  ): Promise<CollateralRatio> {
    return this.collateralService.getUserCollateralRatio(address);
  }

  @Get('collateral/:address/history')
  async getCollateralRatioHistory(
    @Param('address') address: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<CollateralRatio[]> {
    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    const toDate = to ? new Date(to) : new Date();

    return this.collateralService.getCollateralRatioHistory(
      address,
      fromDate,
      toDate,
    );
  }
}

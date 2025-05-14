import { Controller, Get, Param, Query } from '@nestjs/common';
import { PriceService } from '../services/price.service';
import { CollateralService } from '../services/collateral.service';
import { PriceHistory } from '../entities/price-history.entity';
import { CollateralRatio } from '../entities/collateral-ratio.entity';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('market')
@Controller('market')
export class MarketController {
  constructor(
    private readonly priceService: PriceService,
    private readonly collateralService: CollateralService,
  ) {}

  @ApiOperation({ summary: 'Get latest price for a synthetic asset' })
  @ApiParam({
    name: 'symbol',
    description: 'Asset symbol (e.g., sTSLA)',
    example: 'sTSLA',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest price data retrieved successfully',
    type: PriceHistory,
  })
  @ApiResponse({ status: 404, description: 'Price data not found' })
  @Get('price/:symbol')
  async getLatestPrice(@Param('symbol') symbol: string): Promise<PriceHistory> {
    return this.priceService.getLatestPrice(symbol);
  }

  @ApiOperation({ summary: 'Get historical price data for a synthetic asset' })
  @ApiParam({
    name: 'symbol',
    description: 'Asset symbol (e.g., sTSLA)',
    example: 'sTSLA',
  })
  @ApiQuery({
    name: 'from',
    description: 'Start date (ISO format)',
    required: false,
    example: '2025-05-01',
  })
  @ApiQuery({
    name: 'to',
    description: 'End date (ISO format)',
    required: false,
    example: '2025-05-14',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical price data retrieved successfully',
    type: [PriceHistory],
  })
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

  @ApiOperation({ summary: 'Get latest collateral ratio for a user' })
  @ApiParam({
    name: 'address',
    description: 'User wallet address',
    example: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  })
  @ApiResponse({
    status: 200,
    description: 'Collateral ratio data retrieved successfully',
    type: CollateralRatio,
  })
  @ApiResponse({ status: 404, description: 'Collateral data not found' })
  @Get('collateral/:address')
  async getUserCollateralRatio(
    @Param('address') address: string,
  ): Promise<CollateralRatio> {
    return this.collateralService.getUserCollateralRatio(address);
  }

  @ApiOperation({ summary: 'Get historical collateral ratio data for a user' })
  @ApiParam({
    name: 'address',
    description: 'User wallet address',
    example: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  })
  @ApiQuery({
    name: 'from',
    description: 'Start date (ISO format)',
    required: false,
    example: '2025-05-01',
  })
  @ApiQuery({
    name: 'to',
    description: 'End date (ISO format)',
    required: false,
    example: '2025-05-14',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical collateral ratio data retrieved successfully',
    type: [CollateralRatio],
  })
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

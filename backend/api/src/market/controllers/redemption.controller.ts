import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RedemptionService } from '../services/redemption.service';
import { RedemptionHistory } from '../entities/redemption-history.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('redemption')
@Controller('redemption')
export class RedemptionController {
  constructor(private readonly redemptionService: RedemptionService) {}

  @ApiOperation({ summary: 'Redeem sTSLA for the user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userAddress: {
          type: 'string',
          example: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        },
        amount: { type: 'number', example: 5.0 },
        price: { type: 'number', example: 750.25 },
        txId: { type: 'string', example: '5G9s...abc' },
      },
      required: ['userAddress', 'amount', 'price', 'txId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Redemption recorded',
    type: RedemptionHistory,
  })
  @Post()
  async redeemSTesla(
    @Body('userAddress') userAddress: string,
    @Body('amount') amount: number,
    @Body('price') price: number,
    @Body('txId') txId: string,
  ): Promise<RedemptionHistory> {
    return this.redemptionService.redeemSTesla(
      userAddress,
      amount,
      price,
      txId,
    );
  }

  @ApiOperation({ summary: 'Get redemption history for a user' })
  @ApiParam({
    name: 'userAddress',
    description: 'User wallet address',
    example: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  })
  @ApiResponse({
    status: 200,
    description: 'Redemption history retrieved',
    type: [RedemptionHistory],
  })
  @Get(':userAddress/history')
  async getRedemptionHistory(
    @Param('userAddress') userAddress: string,
  ): Promise<RedemptionHistory[]> {
    return this.redemptionService.getRedemptionHistory(userAddress);
  }
}

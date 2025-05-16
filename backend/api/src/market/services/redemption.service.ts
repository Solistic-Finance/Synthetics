import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedemptionHistory } from '../entities/redemption-history.entity';

@Injectable()
export class RedemptionService {
  private readonly logger = new Logger(RedemptionService.name);

  constructor(
    @InjectRepository(RedemptionHistory)
    private readonly redemptionHistoryRepository: Repository<RedemptionHistory>,
  ) {}

  async redeemSTesla(
    userAddress: string,
    amount: number,
    price: number,
    txId: string,
  ): Promise<RedemptionHistory> {
    // TODO: Add blockchain interaction for actual redemption
    const redemption = this.redemptionHistoryRepository.create({
      userAddress,
      amount,
      price,
      txId,
    });
    await this.redemptionHistoryRepository.save(redemption);
    this.logger.log(
      `User ${userAddress} redeemed ${amount} sTSLA at ${price} (tx: ${txId})`,
    );
    return redemption;
  }

  async getRedemptionHistory(
    userAddress: string,
  ): Promise<RedemptionHistory[]> {
    return this.redemptionHistoryRepository.find({
      where: { userAddress },
      order: { timestamp: 'DESC' },
    });
  }
}

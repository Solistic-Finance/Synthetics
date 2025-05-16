import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceHistory } from './entities/price-history.entity';
import { CollateralRatio } from './entities/collateral-ratio.entity';
import { PriceService } from './services/price.service';
import { CollateralService } from './services/collateral.service';
import { MarketController } from './controllers/market.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { RedemptionHistory } from './entities/redemption-history.entity';
import { RedemptionService } from './services/redemption.service';
import { RedemptionController } from './controllers/redemption.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PriceHistory,
      CollateralRatio,
      RedemptionHistory,
    ]),
    BlockchainModule,
  ],
  providers: [PriceService, CollateralService, RedemptionService],
  controllers: [MarketController, RedemptionController],
  exports: [PriceService, CollateralService, RedemptionService],
})
export class MarketModule {}

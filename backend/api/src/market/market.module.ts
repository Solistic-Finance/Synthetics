import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceHistory } from './entities/price-history.entity';
import { CollateralRatio } from './entities/collateral-ratio.entity';
import { PriceService } from './services/price.service';
import { CollateralService } from './services/collateral.service';
import { MarketController } from './controllers/market.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceHistory, CollateralRatio]),
    BlockchainModule,
  ],
  providers: [PriceService, CollateralService],
  controllers: [MarketController],
  exports: [PriceService, CollateralService],
})
export class MarketModule {}

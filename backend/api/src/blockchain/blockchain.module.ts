import { Module } from '@nestjs/common';
import { CollateralBalanceService } from './services/collateral-balance.service';
import { STeslaBalanceService } from './services/stesla-balance.service';
import { ContractEventListenerService } from './services/contract-event-listener.service';
import { BlockchainConfigService } from './services/blockchain-config.service';
import { RiskEngineService } from './services/risk-engine.service';

@Module({
  providers: [
    BlockchainConfigService,
    CollateralBalanceService,
    STeslaBalanceService,
    ContractEventListenerService,
    RiskEngineService,
  ],
  exports: [
    CollateralBalanceService,
    STeslaBalanceService,
    ContractEventListenerService,
    RiskEngineService,
  ],
})
export class BlockchainModule {}

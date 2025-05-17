import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DpsnService } from './dpsn.service';

@Module({
  imports: [ConfigModule],
  providers: [
    DpsnService,
    {
      provide: 'DPSN-Logger',
      useFactory: () => {
        return {
          log: (message: any) => console.log(`[DPSN-Logger] ${message}`),
          error: (message: any) => console.error(`[DPSN-Logger] ${message}`),
        };
      },
    },
  ],
  exports: [DpsnService],
})
export class DpsnModule {}

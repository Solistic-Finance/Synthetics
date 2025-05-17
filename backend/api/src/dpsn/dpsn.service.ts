import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const DpsnClient = require('dpsn-client');

@Injectable()
export class DpsnService implements OnModuleInit {
  private dpsnClient: any;
  private farcasterPublishersTopic: string;

  constructor(
    @Inject('DPSN-Logger')
    private logger: any,
    private readonly configService: ConfigService,
  ) {
    this.farcasterPublishersTopic = this.configService.get<string>(
      'DPSN_FARCASTER_TOPIC',
      'farcaster-publishers',
    );
  }

  onModuleInit() {
    const dpsnUrl = this.configService.get<string>(
      'DPSN_URL',
      'https://dpsn.io',
    );
    const dpsnPvtKey = this.configService.get<string>(
      'DPSN_PRIVATE_KEY',
      'default-key',
    );

    this.dpsnClient = new DpsnClient(dpsnUrl, dpsnPvtKey, {
      network: 'testnet',
      wallet_chain_type: 'ethereum',
    });

    this.dpsnClient.init();

    this.dpsnClient.on('connect', (res: any) => {
      this.logger.log(res);
    });

    this.dpsnClient.on('error', (err: any) => {
      this.logger.error(err);
    });

    this.dpsnClient.on('publish', (res: any) => {
      this.logger.log(res);
    });
  }

  async publish(topicName: string, data: any) {
    try {
      await this.dpsnClient.publish(topicName, data);
    } catch (err) {
      this.logger.error(`Error while publishing: ${err}`);
    }
  }

  async getFarcasterTopicName() {
    return this.farcasterPublishersTopic;
  }
}

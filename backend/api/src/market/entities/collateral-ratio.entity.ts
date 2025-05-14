import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('collateral_ratio')
export class CollateralRatio {
  @ApiProperty({ description: 'Unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Symbol pair for collateral and synthetic asset',
    example: 'SOL/sTSLA',
  })
  @Column({ type: 'varchar', length: 50 })
  symbolPair: string;

  @ApiProperty({ description: 'Collateralization ratio', example: 2.5 })
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  ratio: number;

  @ApiProperty({
    description: 'User wallet address',
    example: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  })
  @Column({ type: 'varchar', length: 44 })
  userAddress: string;

  @ApiProperty({ description: 'Amount of collateral deposited', example: 15.0 })
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  collateralAmount: number;

  @ApiProperty({
    description: 'Amount of synthetic asset minted',
    example: 6.0,
  })
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  syntheticAmount: number;

  @ApiProperty({
    description: 'Timestamp of the ratio calculation',
    example: '2025-05-14T10:30:00.000Z',
  })
  @CreateDateColumn()
  timestamp: Date;
}

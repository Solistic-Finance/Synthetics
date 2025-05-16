import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('redemption_history')
@Index(['userAddress'])
export class RedemptionHistory {
  @ApiProperty({ description: 'Unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'User wallet address',
    example: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  })
  @Column({ type: 'varchar', length: 44 })
  userAddress: string;

  @ApiProperty({ description: 'Amount of sTSLA redeemed', example: 5.0 })
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount: number;

  @ApiProperty({ description: 'Redemption price per sTSLA', example: 750.25 })
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  price: number;

  @ApiProperty({ description: 'Transaction ID', example: '5G9s...abc' })
  @Column({ type: 'varchar', length: 100 })
  txId: string;

  @ApiProperty({
    description: 'Timestamp of the redemption',
    example: '2025-05-14T10:30:00.000Z',
  })
  @CreateDateColumn()
  timestamp: Date;
}

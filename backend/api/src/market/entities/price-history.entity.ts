import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('price_history')
export class PriceHistory {
  @ApiProperty({ description: 'Unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Asset symbol', example: 'sTSLA' })
  @Column({ type: 'varchar', length: 50 })
  symbol: string;

  @ApiProperty({ description: 'Current price', example: 750.25 })
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  price: number;

  @ApiProperty({
    description: 'Opening price for the period',
    example: 748.5,
    required: false,
  })
  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  open: number;

  @ApiProperty({
    description: 'Highest price for the period',
    example: 755.75,
    required: false,
  })
  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  high: number;

  @ApiProperty({
    description: 'Lowest price for the period',
    example: 745.25,
    required: false,
  })
  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  low: number;

  @ApiProperty({
    description: 'Trading volume for the period',
    example: 1250000,
    required: false,
  })
  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  volume: number;

  @ApiProperty({
    description: 'Timestamp of the price data',
    example: '2025-05-14T10:30:00.000Z',
  })
  @CreateDateColumn()
  timestamp: Date;
}

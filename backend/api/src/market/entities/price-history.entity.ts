import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('price_history')
export class PriceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  symbol: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  price: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  open: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  high: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  low: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  volume: number;

  @CreateDateColumn()
  timestamp: Date;
}

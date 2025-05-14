import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('collateral_ratio')
export class CollateralRatio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  symbolPair: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  ratio: number;

  @Column({ type: 'varchar', length: 44 })
  userAddress: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  collateralAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  syntheticAmount: number;

  @CreateDateColumn()
  timestamp: Date;
}

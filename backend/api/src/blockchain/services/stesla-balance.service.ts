import { Injectable } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { BlockchainConfigService } from './blockchain-config.service';

@Injectable()
export class STeslaBalanceService {
  constructor(
    private readonly blockchainConfigService: BlockchainConfigService,
  ) {}

  /**
   * Get the sTesla balance for a specific user
   */
  async getUserSTeslaBalance(userPublicKey: PublicKey): Promise<number> {
    try {
      const program = this.blockchainConfigService.getProgram();

      // Derive the PDA for user's collateral account which also tracks minted amount
      const [userCollateralAccount] = await PublicKey.findProgramAddress(
        [Buffer.from('user_collateral'), userPublicKey.toBuffer()],
        program.programId,
      );

      // Fetch the account data
      const accountInfo = await program.account.userCollateralAccount.fetch(
        userCollateralAccount,
      );

      return Number(accountInfo.mintedAmount);
    } catch (error) {
      console.error('Error fetching user sTesla balance:', error);
      return 0;
    }
  }

  /**
   * Get the total sTesla supply across all users
   */
  async getTotalSTeslaSupply(): Promise<number> {
    try {
      const program = this.blockchainConfigService.getProgram();

      // Get all user collateral accounts
      const accounts = await program.account.userCollateralAccount.all();

      // Sum up all minted amounts
      const totalMinted = accounts.reduce(
        (total, account) => total + Number(account.account.mintedAmount),
        0,
      );

      return totalMinted;
    } catch (error) {
      console.error('Error fetching total sTesla supply:', error);
      return 0;
    }
  }

  /**
   * Get collateralization ratio for a user
   */
  async getUserCollateralizationRatio(
    userPublicKey: PublicKey,
  ): Promise<number> {
    try {
      const program = this.blockchainConfigService.getProgram();

      // Derive the PDA for user's collateral account
      const [userCollateralAccount] = await PublicKey.findProgramAddress(
        [Buffer.from('user_collateral'), userPublicKey.toBuffer()],
        program.programId,
      );

      // Fetch the account data
      const accountInfo = await program.account.userCollateralAccount.fetch(
        userCollateralAccount,
      );

      const depositedAmount = Number(accountInfo.depositedAmount);
      const mintedAmount = Number(accountInfo.mintedAmount);

      // If no minted amount, return infinity or a large number
      if (mintedAmount === 0) {
        return Number.POSITIVE_INFINITY;
      }

      // TODO: In a real implementation, you would convert collateral value based on
      // current SOL price and sTesla's underlying price
      const collateralValue = depositedAmount; // Placeholder, should be SOL amount * SOL price
      const mintedValue = mintedAmount; // Placeholder, should be sTesla amount * Tesla stock price

      return collateralValue / mintedValue;
    } catch (error) {
      console.error('Error calculating collateralization ratio:', error);
      return 0;
    }
  }
}

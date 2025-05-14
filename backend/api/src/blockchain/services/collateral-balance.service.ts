import { Injectable } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { BlockchainConfigService } from './blockchain-config.service';

@Injectable()
export class CollateralBalanceService {
  constructor(
    private readonly blockchainConfigService: BlockchainConfigService,
  ) {}

  /**
   * Get the collateral balance for a specific user
   */
  async getUserCollateralBalance(userPublicKey: PublicKey): Promise<number> {
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

      return Number(accountInfo.depositedAmount);
    } catch (error) {
      console.error('Error fetching user collateral balance:', error);
      return 0;
    }
  }

  /**
   * Get the total collateral in the vault
   */
  async getTotalCollateralBalance(): Promise<number> {
    try {
      const connection = this.blockchainConfigService.getConnection();
      const vaultPubkey = this.blockchainConfigService.getVaultPubkey();

      // Get the SOL balance of the vault
      const lamports = await connection.getBalance(vaultPubkey);

      // Convert lamports to SOL
      return lamports / anchor.web3.LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error fetching total collateral balance:', error);
      return 0;
    }
  }

  /**
   * Get all user collateral accounts
   */
  async getAllUserCollateralAccounts(): Promise<
    { publicKey: PublicKey; depositedAmount: number; mintedAmount: number }[]
  > {
    try {
      const program = this.blockchainConfigService.getProgram();

      // Get all program accounts of type UserCollateralAccount
      const accounts = await program.account.userCollateralAccount.all();

      return accounts.map((account) => ({
        publicKey: account.publicKey,
        depositedAmount: Number(account.account.depositedAmount),
        mintedAmount: Number(account.account.mintedAmount),
      }));
    } catch (error) {
      console.error('Error fetching all user collateral accounts:', error);
      return [];
    }
  }
}

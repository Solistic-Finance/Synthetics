import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { SyntheticSc } from '../target/types/synthetic_sc';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { expect } from 'chai';

describe('Synthetic SC Tests', () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SyntheticSc as Program<SyntheticSc>;

  // Test accounts
  const user = provider.wallet;
  let usdcMint: PublicKey;
  let sTeslaMint: PublicKey;
  let userUsdcAccount: any;
  let userSTeslaAccount: any;
  let vaultAccount: PublicKey;
  let vaultAuthority: PublicKey;
  let vaultUsdcAccount: PublicKey;
  let userCollateralAccount: PublicKey;
  let vaultBump: number;
  let userCollateralBump: number;

  before(async () => {
    // Airdrop SOL to user
    const signature = await provider.connection.requestAirdrop(
      user.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Create USDC mint
    usdcMint = await createMint(
      provider.connection,
      anchor.web3.Keypair.generate(), // Payer
      user.publicKey, // Mint authority
      user.publicKey, // Freeze authority
      6 // Decimals
    );

    // Create sTesla mint for testing
    sTeslaMint = await createMint(
      provider.connection,
      anchor.web3.Keypair.generate(), // Payer
      user.publicKey, // Mint authority (will be transferred to vault)
      user.publicKey, // Freeze authority
      8 // Decimals
    );

    // Create user's USDC token account
    userUsdcAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      anchor.web3.Keypair.generate(), // Payer
      usdcMint,
      user.publicKey
    );

    // Mint USDC to user
    await mintTo(
      provider.connection,
      anchor.web3.Keypair.generate(), // Payer
      usdcMint,
      userUsdcAccount.address,
      user.publicKey, // Authority
      1000_000_000 // 1000 USDC with 6 decimals
    );

    // Create user's sTesla token account
    userSTeslaAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      anchor.web3.Keypair.generate(), // Payer
      sTeslaMint,
      user.publicKey
    );

    // Derive PDAs
    const [vaultAuth, _vaultAuthBump] = await PublicKey.findProgramAddress(
      [Buffer.from('vault-authority')],
      program.programId
    );
    vaultAuthority = vaultAuth;

    const [vault, _vaultBump] = await PublicKey.findProgramAddress(
      [Buffer.from('vault')],
      program.programId
    );
    vaultAccount = vault;
    vaultBump = _vaultBump;

    const [userCollateral, _userCollateralBump] =
      await PublicKey.findProgramAddress(
        [Buffer.from('user-collateral'), user.publicKey.toBuffer()],
        program.programId
      );
    userCollateralAccount = userCollateral;
    userCollateralBump = _userCollateralBump;
  });

  it('Initializes vault and token accounts', async () => {
    try {
      // Get ATA for vault's USDC
      const vaultUsdcATA = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        anchor.web3.Keypair.generate(), // Payer
        usdcMint,
        vaultAuthority,
        true // Allow owner off curve
      );
      vaultUsdcAccount = vaultUsdcATA.address;

      // Initialize the program
      const tx = await program.methods
        .initialize()
        .accounts({
          payer: user.publicKey,
          vaultAuthority: vaultAuthority,
          vault: vaultAccount,
          vaultUsdc: vaultUsdcAccount,
          usdcMint: usdcMint,
          tokenProgram: anchor.spl.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log('Initialize transaction signature', tx);

      // Verify vault account was created with correct data
      const vaultData = await program.account.vault.fetch(vaultAccount);
      expect(vaultData.bump).to.equal(vaultBump);
    } catch (error) {
      console.error('Error in initialization:', error);
      throw error;
    }
  });

  it('Deposits collateral and mints sTSLA tokens', async () => {
    const depositAmount = 100_000_000; // 100 USDC with 6 decimals

    // Get initial balances
    const initialUserUsdcBalance = (
      await provider.connection.getTokenAccountBalance(userUsdcAccount.address)
    ).value.amount;
    const initialVaultUsdcBalance = (
      await provider.connection.getTokenAccountBalance(vaultUsdcAccount)
    ).value.amount;
    const initialUserSTeslaBalance = (
      await provider.connection.getTokenAccountBalance(
        userSTeslaAccount.address
      )
    ).value.amount;

    // Execute deposit
    const tx = await program.methods
      .depositCollateral(new anchor.BN(depositAmount))
      .accounts({
        user: user.publicKey,
        userUsdc: userUsdcAccount.address,
        vault: vaultAccount,
        vaultUsdc: vaultUsdcAccount,
        vaultAuthority: vaultAuthority,
        userCollateral: userCollateralAccount,
        userSTsla: userSTeslaAccount.address,
        sTslaMint: sTeslaMint,
        tokenProgram: anchor.spl.token.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('Deposit transaction signature', tx);

    // Check user USDC balance decreased
    const finalUserUsdcBalance = (
      await provider.connection.getTokenAccountBalance(userUsdcAccount.address)
    ).value.amount;
    expect(Number(finalUserUsdcBalance)).to.equal(
      Number(initialUserUsdcBalance) - depositAmount
    );

    // Check vault USDC balance increased
    const finalVaultUsdcBalance = (
      await provider.connection.getTokenAccountBalance(vaultUsdcAccount)
    ).value.amount;
    expect(Number(finalVaultUsdcBalance)).to.equal(
      Number(initialVaultUsdcBalance) + depositAmount
    );

    // Check user collateral account was updated
    const userCollateralData =
      await program.account.userCollateralAccount.fetch(userCollateralAccount);
    expect(userCollateralData.owner.toString()).to.equal(
      user.publicKey.toString()
    );
    expect(userCollateralData.depositedAmount.toString()).to.equal(
      depositAmount.toString()
    );

    // Check sTesla tokens were minted to user (66.666... with 150% collateralization ratio)
    const expectedMinted = Math.floor((depositAmount * 100) / 150);
    expect(userCollateralData.mintedAmount.toString()).to.equal(
      expectedMinted.toString()
    );

    const finalUserSTeslaBalance = (
      await provider.connection.getTokenAccountBalance(
        userSTeslaAccount.address
      )
    ).value.amount;
    expect(Number(finalUserSTeslaBalance)).to.equal(
      Number(initialUserSTeslaBalance) + expectedMinted
    );
  });

  it('Deposits additional collateral and mints more sTSLA', async () => {
    const additionalDeposit = 50_000_000; // 50 USDC

    // Get initial balances
    const initialUserCollateralData =
      await program.account.userCollateralAccount.fetch(userCollateralAccount);
    const initialUserSTeslaBalance = (
      await provider.connection.getTokenAccountBalance(
        userSTeslaAccount.address
      )
    ).value.amount;

    // Execute deposit
    const tx = await program.methods
      .depositCollateral(new anchor.BN(additionalDeposit))
      .accounts({
        user: user.publicKey,
        userUsdc: userUsdcAccount.address,
        vault: vaultAccount,
        vaultUsdc: vaultUsdcAccount,
        vaultAuthority: vaultAuthority,
        userCollateral: userCollateralAccount,
        userSTsla: userSTeslaAccount.address,
        sTslaMint: sTeslaMint,
        tokenProgram: anchor.spl.token.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('Additional deposit transaction signature', tx);

    // Check user collateral account was updated
    const finalUserCollateralData =
      await program.account.userCollateralAccount.fetch(userCollateralAccount);
    const expectedTotalDeposit =
      Number(initialUserCollateralData.depositedAmount) + additionalDeposit;
    expect(Number(finalUserCollateralData.depositedAmount)).to.equal(
      expectedTotalDeposit
    );

    // Check additional sTesla tokens were minted
    const totalAllowedMint = Math.floor((expectedTotalDeposit * 100) / 150);
    const additionalMinted =
      totalAllowedMint - Number(initialUserCollateralData.mintedAmount);

    expect(Number(finalUserCollateralData.mintedAmount)).to.equal(
      totalAllowedMint
    );

    const finalUserSTeslaBalance = (
      await provider.connection.getTokenAccountBalance(
        userSTeslaAccount.address
      )
    ).value.amount;
    expect(Number(finalUserSTeslaBalance)).to.equal(
      Number(initialUserSTeslaBalance) + additionalMinted
    );
  });

  it("Fails to deposit when token account doesn't match", async () => {
    const invalidMint = await createMint(
      provider.connection,
      anchor.web3.Keypair.generate(),
      user.publicKey,
      user.publicKey,
      6
    );

    const invalidTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      anchor.web3.Keypair.generate(),
      invalidMint,
      user.publicKey
    );

    try {
      await program.methods
        .depositCollateral(new anchor.BN(10_000_000))
        .accounts({
          user: user.publicKey,
          userUsdc: invalidTokenAccount.address, // Using wrong token account
          vault: vaultAccount,
          vaultUsdc: vaultUsdcAccount,
          vaultAuthority: vaultAuthority,
          userCollateral: userCollateralAccount,
          userSTsla: userSTeslaAccount.address,
          sTslaMint: sTeslaMint,
          tokenProgram: anchor.spl.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      // If we reach here, the test failed because the transaction should have failed
      expect.fail(
        'Transaction should have failed due to token account mismatch'
      );
    } catch (error) {
      // Expected to fail with a constraint error
      expect(error.toString()).to.include('Error');
    }
  });
});

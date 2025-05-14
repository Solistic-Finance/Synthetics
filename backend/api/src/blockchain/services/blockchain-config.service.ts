import { Injectable } from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';

@Injectable()
export class BlockchainConfigService {
  private readonly connection: Connection;
  private readonly program: anchor.Program;
  private readonly vaultPubkey: PublicKey;

  constructor() {
    // Initialize Solana connection (update with appropriate network)
    this.connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );

    // Initialize Anchor provider with a default keypair for read-only operations
    const provider = new anchor.AnchorProvider(
      this.connection,
      new anchor.Wallet(anchor.web3.Keypair.generate()),
      { commitment: 'confirmed' },
    );

    // Program ID from the smart contract
    const programId = new PublicKey(
      'JDkBcK2QCSdNdau1BVF5TwUrRyNMD9w4BBBpyj4u4Uq5',
    );

    // Load the IDL (will need to be generated or provided)
    // For now, this is a placeholder
    const idl = {} as anchor.Idl; // Replace with actual IDL

    // Initialize the program
    this.program = new anchor.Program(idl, programId, provider);

    // Initialize vault public key (would need to be retrieved or configured)
    this.vaultPubkey = new PublicKey('vault_pubkey_placeholder'); // Replace with actual vault address
  }

  getConnection(): Connection {
    return this.connection;
  }

  getProgram(): anchor.Program {
    return this.program;
  }

  getVaultPubkey(): PublicKey {
    return this.vaultPubkey;
  }
}

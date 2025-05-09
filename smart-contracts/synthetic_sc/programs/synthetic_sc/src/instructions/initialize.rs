use crate::state::vault::Vault;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: PDA used as authority over vault_usdc
    #[account(
        seeds = [b"vault-authority"],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        seeds = [b"vault"],
        bump,
        space =  8 + 1 + 32 + 8 + 8 + 8,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = payer,
        token::mint = usdc_mint,
        token::authority = vault_authority,
    )]
    pub vault_usdc: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.vault.bump = ctx.bumps.vault;
    Ok(())
}

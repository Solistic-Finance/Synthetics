use crate::events::deposit_event::CollateralDeposited;
use crate::state::{user_collateral_account::*, vault::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        constraint = vault_usdc.owner == vault_authority.key(),
        constraint = vault_usdc.mint == user_usdc.mint,
    )]
    pub vault_usdc: Account<'info, TokenAccount>,

    /// CHECK: Only used as PDA signer
    #[account(
        seeds = [b"vault-authority"],
        bump = vault.bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"user-collateral", user.key().as_ref()],
        bump,
        space = 8 + 1 + 32 + 8 + 8 + 8, 
    )]
    pub user_collateral: Account<'info, UserCollateralAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_usdc.to_account_info(),
        to: ctx.accounts.vault_usdc.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    let clock = Clock::get()?;

    let user_data = &mut ctx.accounts.user_collateral;
    user_data.owner = ctx.accounts.user.key();
    user_data.bump = ctx.bumps.user_collateral;
    user_data.deposited_amount += amount;
    user_data.last_deposit_ts = clock.unix_timestamp;

    emit!(CollateralDeposited {
        user: ctx.accounts.user.key(),
        amount,
    });

    Ok(())
}

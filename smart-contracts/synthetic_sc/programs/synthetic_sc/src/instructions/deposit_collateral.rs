use crate::events::deposit_event::CollateralDeposited;
use crate::events::stesla_minted::STeslaMinted;
use crate::state::{user_collateral_account::*, vault::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint, MintTo};
use crate::error::ErrorCode;

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

    // New accounts for minting sTSLA
    #[account(mut)]
    pub user_s_tsla: Account<'info, TokenAccount>,
    #[account(mut)]
    pub s_tsla_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

fn max_s_tsla_to_mint(collateral: u64) -> Result<u64> {
    let mul = collateral
        .checked_mul(100)
        .ok_or(ErrorCode::MathOverflow)
        .map_err(anchor_lang::error::Error::from)?;
    let div = mul
        .checked_div(150)
        .ok_or(ErrorCode::MathOverflow)
        .map_err(anchor_lang::error::Error::from)?;
    Ok(div)
}

pub fn handle(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
    // 1. Transfer USDC from user to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_usdc.to_account_info(),
        to: ctx.accounts.vault_usdc.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // 2. Update user collateral account
    let clock = Clock::get()?;
    let user_data = &mut ctx.accounts.user_collateral;
    user_data.owner = ctx.accounts.user.key();
    user_data.bump = ctx.bumps.user_collateral;
    user_data.deposited_amount += amount;
    user_data.last_deposit_ts = clock.unix_timestamp;

    // 3. Calculate max sTSLA to mint
    let max_mint = max_s_tsla_to_mint(user_data.deposited_amount)?;
    let already_minted = user_data.minted_amount;
    let mint_now = max_mint.saturating_sub(already_minted);
    if mint_now > 0 {
        let bump = ctx.accounts.vault.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[b"vault-authority", &[bump]]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.s_tsla_mint.to_account_info(),
                    to: ctx.accounts.user_s_tsla.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                signer_seeds,
            ),
            mint_now,
        )?;
        user_data.minted_amount += mint_now;
        emit!(STeslaMinted {
            user: ctx.accounts.user.key(),
            amount: mint_now,
        });
    }

    emit!(CollateralDeposited {
        user: ctx.accounts.user.key(),
        amount,
    });

    Ok(())
}

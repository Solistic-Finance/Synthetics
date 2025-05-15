use crate::error::ErrorCode;
use crate::state::user_collateral_account::*;
use crate::state::vault::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};
// TODO: Uncomment and use Pyth oracle in production
// use pyth_sdk_solana::state::load_price_feed_from_account_info;

#[derive(Accounts)]
#[instruction(redeem_amount: u64)]
pub struct RedeemSTSLA<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_s_tsla: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub s_tsla_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        constraint = vault_usdc.owner == vault_authority.key(),
    )]
    pub vault_usdc: Account<'info, TokenAccount>,

    /// CHECK: PDA signer
    #[account(
        seeds = [b"vault-authority"],
        bump = vault.bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"user-collateral", user.key().as_ref()],
        bump,
        constraint = user_collateral.owner == user.key() @ ErrorCode::Unauthorized,
    )]
    pub user_collateral: Account<'info, UserCollateralAccount>,

    /// CHECK: Price feed account - will use Pyth in production
    #[account(mut)]
    pub tsla_price_feed: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handle(ctx: Context<RedeemSTSLA>, redeem_amount: u64) -> Result<()> {
    // 1. Mock TSLA price (in production, we would use Pyth oracle)
    // TODO: Replace with actual Pyth oracle call:
    // let price_feed = load_price_feed_from_account_info(&ctx.accounts.tsla_price_feed)?;
    // let price = price_feed.get_current_price().ok_or(ErrorCode::NoOraclePrice)?;
    // let tsla_price = price.price as u64;
    let tsla_price = 800_000_000; // $800 with 6 decimals

    // 2. Burn sTSLA
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.s_tsla_mint.to_account_info(),
                from: ctx.accounts.user_s_tsla.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        redeem_amount,
    )?;

    // 3. Calculate USDC to return
    // Required: 1.5x collateral backing per sTSLA → USDC out = redeem_amount * tsla_price * 1 / 1.5
    let base_usdc = redeem_amount
        .checked_mul(tsla_price)
        .ok_or(ErrorCode::MathOverflow)?;

    let usdc_out = base_usdc
        .checked_div(150)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_mul(100)
        .ok_or(ErrorCode::MathOverflow)?;

    require!(
        ctx.accounts.user_collateral.deposited_amount >= usdc_out,
        ErrorCode::InsufficientCollateral
    );

    // 4. Transfer USDC to user
    let vault_bump = ctx.accounts.vault.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[b"vault-authority", &[vault_bump]]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_usdc.to_account_info(),
                to: ctx.accounts.user_usdc.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            signer_seeds,
        ),
        usdc_out,
    )?;

    // 5. Update user state
    let user_data = &mut ctx.accounts.user_collateral;
    user_data.minted_amount = user_data.minted_amount.saturating_sub(redeem_amount);
    user_data.deposited_amount = user_data.deposited_amount.saturating_sub(usdc_out);

    Ok(())
}

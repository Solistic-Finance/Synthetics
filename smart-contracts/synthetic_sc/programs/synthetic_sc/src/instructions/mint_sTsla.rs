use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::error::ErrorCode;
use crate::state::user_collateral_account::*;

#[derive(Accounts)]
pub struct MintSTSLA<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_s_tsla: Account<'info, TokenAccount>,

    #[account(mut)]
    pub s_tsla_mint: Account<'info, Mint>,

    /// CHECK: Only used as signer
    #[account(
        seeds = [b"vault-authority"],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"user-collateral", user.key().as_ref()],
        bump = user_collateral.bump,
        has_one = owner @ ErrorCode::Unauthorized,
    )]
    pub user_collateral: Account<'info, UserCollateralAccount>,

    /// CHECK: This is the owner of the UserCollateralAccount. Checked by the has_one constraint.
    pub owner: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handle(ctx: Context<MintSTSLA>, mint_amount: u64) -> Result<()> {
    let user = &ctx.accounts.user;
    let user_data = &mut ctx.accounts.user_collateral;

    // Collateralization check: user must have 150% of the mint_amount
    let required_collateral = mint_amount
        .checked_mul(150)
        .ok_or(ErrorCode::MathOverflow)?
        / 100;

    require!(
        user_data.deposited_amount >= required_collateral,
        ErrorCode::InsufficientCollateral
    );

    let bump = ctx.bumps.vault_authority;
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
        mint_amount,
    )?;

    user_data.minted_amount += mint_amount;

    Ok(())
}

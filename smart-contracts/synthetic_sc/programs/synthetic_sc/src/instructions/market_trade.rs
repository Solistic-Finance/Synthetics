use crate::error::ErrorCode;
use crate::events::trade_executed::TradeExecuted;
use crate::state::user_collateral_account::*;
use crate::state::vault::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

#[derive(Accounts)]
#[instruction(amount: u64, is_buy: bool)]
pub struct MarketTrade<'info> {
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
        init_if_needed,
        payer = user,
        seeds = [b"user-collateral", user.key().as_ref()],
        bump,
        space = 8 + 1 + 32 + 8 + 8 + 8, 
    )]
    pub user_collateral: Account<'info, UserCollateralAccount>,

    /// CHECK: Price feed account - will use Pyth in production
    #[account(mut)]
    pub tsla_price_feed: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle(ctx: Context<MarketTrade>, amount: u64, is_buy: bool) -> Result<()> {
    // Get the current Tesla price (mock for now, will use oracle in production)
    // In production: let price_feed = load_price_feed_from_account_info(&ctx.accounts.tsla_price_feed)?;
    // let price = price_feed.get_current_price().ok_or(ErrorCode::NoOraclePrice)?;
    // let tsla_price = price.price as u64;
    let tsla_price = 800_000_000; // $800 with 6 decimals
    
    let vault_bump = ctx.accounts.vault.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[b"vault-authority", &[vault_bump]]];

    if is_buy {
        // Buy sTSLA: User provides USDC, receives sTSLA
        
        // 1. Calculate USDC required (with 1.5x collateralization)
        let usdc_required = amount
            .checked_mul(tsla_price)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_mul(150)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::MathOverflow)?;
            
        // 2. Transfer USDC from user to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_usdc.to_account_info(),
                    to: ctx.accounts.vault_usdc.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            usdc_required,
        )?;
        
        // 3. Mint sTSLA to user
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
            amount,
        )?;
        
        // 4. Update user state
        let user_data = &mut ctx.accounts.user_collateral;
        let clock = Clock::get()?;
        user_data.owner = ctx.accounts.user.key();
        user_data.bump = ctx.bumps.user_collateral;
        user_data.deposited_amount = user_data.deposited_amount.checked_add(usdc_required).ok_or(ErrorCode::MathOverflow)?;
        user_data.minted_amount = user_data.minted_amount.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
        user_data.last_deposit_ts = clock.unix_timestamp;
        
        // Emit trade event
        emit!(TradeExecuted {
            user: ctx.accounts.user.key(),
            is_buy: true,
            amount,
            usdc_amount: usdc_required,
            price: tsla_price,
        });
    } else {
        // Sell sTSLA: User provides sTSLA, receives USDC
        
        // 1. Calculate USDC to return
        let base_usdc = amount
            .checked_mul(tsla_price)
            .ok_or(ErrorCode::MathOverflow)?;
            
        let usdc_out = base_usdc
            .checked_div(150)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_mul(100)
            .ok_or(ErrorCode::MathOverflow)?;
            
        // Check if user has enough sTSLA and collateral
        require!(
            ctx.accounts.user_collateral.minted_amount >= amount,
            ErrorCode::InsufficientSyntheticBalance
        );
        
        require!(
            ctx.accounts.user_collateral.deposited_amount >= usdc_out,
            ErrorCode::InsufficientCollateral
        );
        
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
            amount,
        )?;
        
        // 3. Transfer USDC to user
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
        
        // 4. Update user state
        let user_data = &mut ctx.accounts.user_collateral;
        user_data.minted_amount = user_data.minted_amount.saturating_sub(amount);
        user_data.deposited_amount = user_data.deposited_amount.saturating_sub(usdc_out);
        
        // Emit trade event
        emit!(TradeExecuted {
            user: ctx.accounts.user.key(),
            is_buy: false,
            amount,
            usdc_amount: usdc_out,
            price: tsla_price,
        });
    }
    
    Ok(())
} 
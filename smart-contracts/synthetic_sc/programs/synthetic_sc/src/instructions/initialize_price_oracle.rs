use crate::state::price_oracle::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializePriceOracle<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [b"price-oracle"],
        bump,
        space = 8 + 1 + 32 + 8 + 8 + 1, // Discriminator + bump + authority + last_update_timestamp + price + status
    )]
    pub price_oracle: Account<'info, PriceOracle>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<InitializePriceOracle>) -> Result<()> {
    let price_oracle = &mut ctx.accounts.price_oracle;
    price_oracle.bump = ctx.bumps.price_oracle;
    price_oracle.authority = ctx.accounts.payer.key(); // Initial authority is the payer
    price_oracle.status = PriceStatus::Unknown;
    price_oracle.price = 0;
    price_oracle.last_update_timestamp = Clock::get()?.unix_timestamp;
    Ok(())
}

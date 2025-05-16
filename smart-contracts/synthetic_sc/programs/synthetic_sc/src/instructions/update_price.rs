use crate::error::ErrorCode;
use crate::state::price_oracle::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(mut)]
    pub price_oracle: Account<'info, PriceOracle>,

    pub authority: Signer<'info>,
}

pub fn handle(ctx: Context<UpdatePrice>, new_price: u64) -> Result<()> {
    let price_oracle = &mut ctx.accounts.price_oracle;

    // Verify authority
    require!(
        price_oracle.authority == ctx.accounts.authority.key(),
        ErrorCode::Unauthorized
    );

    // Update oracle state
    price_oracle.price = new_price;
    price_oracle.last_update_timestamp = Clock::get()?.unix_timestamp;
    price_oracle.status = PriceStatus::Trading;

    Ok(())
}

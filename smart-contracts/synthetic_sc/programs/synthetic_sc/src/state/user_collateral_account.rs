use anchor_lang::prelude::*;

#[account]
pub struct UserCollateralAccount {
    pub bump: u8,
    pub owner: Pubkey,
    pub deposited_amount: u64,
    pub minted_amount: u64,
    pub last_deposit_ts: i64,
}

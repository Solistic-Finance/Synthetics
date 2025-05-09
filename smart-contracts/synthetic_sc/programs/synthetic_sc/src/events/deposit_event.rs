use anchor_lang::prelude::*;

#[event]
pub struct CollateralDeposited {
    pub user: Pubkey,
    pub amount: u64,
}

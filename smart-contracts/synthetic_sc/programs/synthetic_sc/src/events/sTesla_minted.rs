use anchor_lang::prelude::*;

#[event]
pub struct STeslaMinted {
    pub user: Pubkey,
    pub amount: u64,
}

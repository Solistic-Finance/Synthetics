use anchor_lang::prelude::*;

#[event]
pub struct sTeslaMinted {
    pub user: Pubkey,
    pub amount: u64,
}

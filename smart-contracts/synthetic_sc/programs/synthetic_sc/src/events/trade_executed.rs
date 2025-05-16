use anchor_lang::prelude::*;

#[event]
pub struct TradeExecuted {
    pub user: Pubkey,
    pub is_buy: bool,
    pub amount: u64,
    pub usdc_amount: u64,
    pub price: u64,
}

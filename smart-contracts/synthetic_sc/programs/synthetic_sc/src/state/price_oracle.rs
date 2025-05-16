use anchor_lang::prelude::*;

#[account]
pub struct PriceOracle {
    pub bump: u8,
    pub authority: Pubkey, // The pub/sub service authority that can update prices
    pub last_update_timestamp: i64,
    pub price: u64, // Price in USDC (6 decimals)
    pub status: PriceStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PriceStatus {
    Unknown,
    Trading,
    Halted,
}

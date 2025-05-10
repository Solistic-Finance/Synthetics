use anchor_lang::prelude::*;

pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::DepositCollateral;
use instructions::*;

declare_id!("JDkBcK2QCSdNdau1BVF5TwUrRyNMD9w4BBBpyj4u4Uq5");

#[program]
pub mod synthetic_sc {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        crate::instructions::initialize::handle(ctx)
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        crate::instructions::deposit_collateral::handle(ctx, amount)
    }

}

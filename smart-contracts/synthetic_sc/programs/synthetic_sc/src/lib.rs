use anchor_lang::prelude::*;

pub mod events;
pub mod instructions;
pub mod state;

declare_id!("JDkBcK2QCSdNdau1BVF5TwUrRyNMD9w4BBBpyj4u4Uq5");

#[program]
pub mod synthetic_sc {
    use super::*;
    use instructions::deposit_collateral::DepositCollateral;
    use instructions::initialize::Initialize;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handle(ctx)
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        instructions::deposit_collateral::handle(ctx, amount)
    }
}

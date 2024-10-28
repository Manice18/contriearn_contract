use anchor_lang::prelude::*;

pub mod contexts;
pub mod states;

use contexts::*;

declare_id!("4xMcXKdwTsSrdTKoZBc59dUwpKeCfZyf7DGaMDi8x8Gp");

#[program]
pub mod contriearn_escrow {
    use super::*;

    pub fn make(ctx: Context<Make>, seed: u64, deposit: u64) -> Result<()> {
        ctx.accounts.init_escrow(seed, &ctx.bumps)?;
        ctx.accounts.deposit(deposit)
    }

    pub fn take(ctx: Context<Take>, amount: u64) -> Result<()> {
        ctx.accounts.withdraw_and_close_vault(amount)
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.withdraw_and_close_vault()
    }
}

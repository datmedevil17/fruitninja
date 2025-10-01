use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::commit;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;
use crate::state::{GameSession, SliceBuffer};
use crate::errors::GameError;

pub fn finalize_and_undelegate(ctx: Context<FinalizeAndUndelegate>) -> Result<()> {
    require!(ctx.accounts.game_session.is_finalized, GameError::GameNotFinalized);
    
    commit_and_undelegate_accounts(
        &ctx.accounts.payer,
        vec![&ctx.accounts.slice_buffer.to_account_info()],
        &ctx.accounts.magic_context,
        &ctx.accounts.magic_program,
    )?;
    
    msg!("Game finalized and undelegated from ephemeral rollup");
    Ok(())
}

#[commit]
#[derive(Accounts)]
pub struct FinalizeAndUndelegate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(mut)]
    pub game_session: Account<'info, GameSession>,
    
    #[account(mut)]
    pub slice_buffer: Account<'info, SliceBuffer>,
}


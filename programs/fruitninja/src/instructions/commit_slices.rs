use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::commit;
use ephemeral_rollups_sdk::ephem::commit_accounts;
use crate::state::SliceBuffer;

pub fn commit_slices(ctx: Context<CommitSlices>) -> Result<()> {
    commit_accounts(
        &ctx.accounts.payer,
        vec![&ctx.accounts.slice_buffer.to_account_info()],
        &ctx.accounts.magic_context,
        &ctx.accounts.magic_program,
    )?;
    
    msg!("Slice buffer committed");
    Ok(())
}

#[commit]
#[derive(Accounts)]
pub struct CommitSlices<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(mut)]
    pub slice_buffer: Account<'info, SliceBuffer>,
}

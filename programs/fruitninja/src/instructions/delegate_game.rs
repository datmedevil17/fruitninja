use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use crate::state::SliceBuffer;
use crate::SLICE_BUFFER_SEED;

pub fn delegate_game(ctx: Context<DelegateGame>) -> Result<()> {
    ctx.accounts.delegate_pda(
        &ctx.accounts.payer,
        &[SLICE_BUFFER_SEED, &ctx.accounts.slice_buffer.game_id.to_le_bytes(), ctx.accounts.slice_buffer.player.as_ref()],
        DelegateConfig {
            commit_frequency_ms: 5_000,
            validator: Some(pubkey!("MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57")),
        },
    )?;
    
    msg!("Game session delegated to ephemeral rollup");
    Ok(())
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateGame<'info> {
    pub payer: Signer<'info>,
    
    #[account(mut, del)]
    /// CHECK: The slice buffer PDA to delegate
    pub pda: AccountInfo<'info>,
    
    #[account(mut)]
    pub slice_buffer: Account<'info, SliceBuffer>,
}

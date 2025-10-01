use anchor_lang::prelude::*;
use crate::state::{GameSession, SliceBuffer, SliceData};
use crate::errors::GameError;
use crate::SLICE_BUFFER_SEED;

pub fn record_slice(
    ctx: Context<RecordSlice>,
    fruit_type: u8,
    slice_value: u16,
    timestamp: i64,
) -> Result<()> {
    let slice_buffer = &mut ctx.accounts.slice_buffer;
    
    require!(!ctx.accounts.game_session.is_finalized, GameError::GameAlreadyFinalized);
    require!(slice_buffer.slice_count < 1000, GameError::MaxSlicesReached);
    
    let idx = slice_buffer.slice_count as usize;
    slice_buffer.slices[idx] = SliceData {
        fruit_type,
        slice_value,
        timestamp,
    };
    
    slice_buffer.slice_count += 1;
    slice_buffer.last_slice_timestamp = timestamp;
    
    msg!("Slice recorded: type={}, value={}, count={}", fruit_type, slice_value, slice_buffer.slice_count);
    Ok(())
}

#[derive(Accounts)]
pub struct RecordSlice<'info> {
    #[account(mut)]
    pub game_session: Account<'info, GameSession>,
    
    #[account(
        mut,
        seeds = [SLICE_BUFFER_SEED, &slice_buffer.game_id.to_le_bytes(), slice_buffer.player.as_ref()],
        bump = slice_buffer.bump
    )]
    pub slice_buffer: Account<'info, SliceBuffer>,
    
    pub player: Signer<'info>,
}
 
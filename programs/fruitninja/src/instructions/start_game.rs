use anchor_lang::prelude::*;
use crate::state::{GameSession, SliceBuffer};
use crate::{GAME_SESSION_SEED, SLICE_BUFFER_SEED};

pub fn start_game(ctx: Context<StartGame>, game_id: u64) -> Result<()> {
    let game_session = &mut ctx.accounts.game_session;
    let slice_buffer = &mut ctx.accounts.slice_buffer;
    
    game_session.player = ctx.accounts.player.key();
    game_session.game_id = game_id;
    game_session.start_time = Clock::get()?.unix_timestamp;
    game_session.end_time = 0;
    game_session.final_score = 0;
    game_session.is_finalized = false;
    game_session.total_slices = 0;
    game_session.bump = ctx.bumps.game_session;
    
    slice_buffer.game_id = game_id;
    slice_buffer.player = ctx.accounts.player.key();
    slice_buffer.slice_count = 0;
    slice_buffer.last_slice_timestamp = 0;
    slice_buffer.bump = ctx.bumps.slice_buffer;
    
    msg!("Game {} started for player {}", game_id, ctx.accounts.player.key());
    Ok(())
}

#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct StartGame<'info> {
    #[account(
        init,
        payer = player,
        space = 8 + GameSession::SIZE,
        seeds = [GAME_SESSION_SEED, &game_id.to_le_bytes(), player.key().as_ref()],
        bump
    )]
    pub game_session: Account<'info, GameSession>,
    
    #[account(
        init,
        payer = player,
        space = 8 + SliceBuffer::SIZE,
        seeds = [SLICE_BUFFER_SEED, &game_id.to_le_bytes(), player.key().as_ref()],
        bump
    )]
    pub slice_buffer: Account<'info, SliceBuffer>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

use anchor_lang::prelude::*;
use crate::state::{GameSession, SliceBuffer, GameAuthority};
use crate::errors::GameError;
use crate::utils::verify_backend_signature;
use crate::{GAME_SESSION_SEED, SLICE_BUFFER_SEED, GAME_AUTHORITY_SEED};

pub fn submit_final_score(
    ctx: Context<SubmitFinalScore>,
    final_score: u64,
    timestamp: i64,
    signature: [u8; 64],
    recovery_id: u8,
) -> Result<()> {
    let game_session = &mut ctx.accounts.game_session;
    let game_authority = &ctx.accounts.game_authority;
    
    require!(!game_session.is_finalized, GameError::GameAlreadyFinalized);
    require!(game_session.player == ctx.accounts.player.key(), GameError::UnauthorizedPlayer);
    
    verify_backend_signature(
        game_session.player,
        game_session.game_id,
        final_score,
        timestamp,
        &signature,
        recovery_id,
        game_authority.backend_signer,
    )?;
    
    game_session.final_score = final_score;
    game_session.end_time = timestamp;
    game_session.is_finalized = true;
    game_session.total_slices = ctx.accounts.slice_buffer.slice_count;
    
    let game_authority = &mut ctx.accounts.game_authority;
    game_authority.total_games += 1;
    
    msg!(
        "Game {} finalized - Player: {}, Score: {}, Slices: {}",
        game_session.game_id,
        game_session.player,
        final_score,
        game_session.total_slices
    );
    
    Ok(())
}

#[derive(Accounts)]
pub struct SubmitFinalScore<'info> {
    #[account(
        mut,
        seeds = [GAME_SESSION_SEED, &game_session.game_id.to_le_bytes(), game_session.player.as_ref()],
        bump = game_session.bump
    )]
    pub game_session: Account<'info, GameSession>,
    
    #[account(
        seeds = [SLICE_BUFFER_SEED, &slice_buffer.game_id.to_le_bytes(), slice_buffer.player.as_ref()],
        bump = slice_buffer.bump
    )]
    pub slice_buffer: Account<'info, SliceBuffer>,
    
    #[account(
        mut,
        seeds = [GAME_AUTHORITY_SEED],
        bump = game_authority.bump
    )]
    pub game_authority: Account<'info, GameAuthority>,
    
    pub player: Signer<'info>,
}
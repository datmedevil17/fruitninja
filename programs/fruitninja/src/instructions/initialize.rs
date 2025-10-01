use anchor_lang::prelude::*;
use crate::state::GameAuthority;
use crate::GAME_AUTHORITY_SEED;

pub fn initialize(ctx: Context<Initialize>, backend_pubkey: Pubkey) -> Result<()> {
    let game_authority = &mut ctx.accounts.game_authority;
    game_authority.authority = ctx.accounts.authority.key();
    game_authority.backend_signer = backend_pubkey;
    game_authority.total_games = 0;
    game_authority.bump = ctx.bumps.game_authority;
    
    msg!("Game authority initialized with backend signer: {}", backend_pubkey);
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + GameAuthority::SIZE,
        seeds = [GAME_AUTHORITY_SEED],
        bump
    )]
    pub game_authority: Account<'info, GameAuthority>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

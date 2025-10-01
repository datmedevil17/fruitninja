use anchor_lang::prelude::*;
use crate::state::GameAuthority;
use crate::GAME_AUTHORITY_SEED;

pub fn update_backend_signer(
    ctx: Context<UpdateBackendSigner>,
    new_backend_signer: Pubkey,
) -> Result<()> {
    let game_authority = &mut ctx.accounts.game_authority;
    game_authority.backend_signer = new_backend_signer;
    
    msg!("Backend signer updated to: {}", new_backend_signer);
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateBackendSigner<'info> {
    #[account(
        mut,
        seeds = [GAME_AUTHORITY_SEED],
        bump = game_authority.bump,
        has_one = authority
    )]
    pub game_authority: Account<'info, GameAuthority>,
    
    pub authority: Signer<'info>,
}
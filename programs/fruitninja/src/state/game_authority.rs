use anchor_lang::prelude::*;

#[account]
pub struct GameAuthority {
    pub authority: Pubkey,
    pub backend_signer: Pubkey,
    pub total_games: u64,
    pub bump: u8,
}

impl GameAuthority {
    pub const SIZE: usize = 32 + 32 + 8 + 1;
}
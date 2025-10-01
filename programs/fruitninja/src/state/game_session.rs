use anchor_lang::prelude::*;

#[account]
pub struct GameSession {
    pub player: Pubkey,
    pub game_id: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub final_score: u64,
    pub total_slices: u16,
    pub is_finalized: bool,
    pub bump: u8,
}

impl GameSession {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 8 + 2 + 1 + 1;
}
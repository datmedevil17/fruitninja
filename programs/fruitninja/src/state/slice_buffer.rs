use anchor_lang::prelude::*;

#[account]
pub struct SliceBuffer {
    pub game_id: u64,
    pub player: Pubkey,
    pub slice_count: u16,
    pub last_slice_timestamp: i64,
    pub slices: [SliceData; 1000],
    pub bump: u8,
}

impl SliceBuffer {
    pub const SIZE: usize = 8 + 32 + 2 + 8 + 11000 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct SliceData {
    pub fruit_type: u8,
    pub slice_value: u16,
    pub timestamp: i64,
}

#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::ephemeral;


declare_id!("8LJqbPMhiDLp4vbzdfR7wHwY6VoYajzRkqafK9TS2HNB");


pub mod instructions;
pub mod state;
pub mod errors;
pub mod utils;


pub const GAME_SESSION_SEED: &[u8] = b"game-session";
pub const GAME_AUTHORITY_SEED: &[u8] = b"game-authority";
pub const SLICE_BUFFER_SEED: &[u8] = b"slice-buffer";

#[ephemeral]
#[program]
pub mod fruit_ninja_game {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, backend_pubkey: Pubkey) -> Result<()> {
        instructions::initialize(ctx, backend_pubkey)
    }

    pub fn update_backend_signer(
        ctx: Context<UpdateBackendSigner>,
        new_backend_signer: Pubkey,
    ) -> Result<()> {
        instructions::update_backend_signer(ctx, new_backend_signer)
    }

    pub fn start_game(ctx: Context<StartGame>, game_id: u64) -> Result<()> {
        instructions::start_game(ctx, game_id)
    }

    pub fn delegate_game(ctx: Context<DelegateGame>) -> Result<()> {
        instructions::delegate_game(ctx)
    }

    pub fn record_slice(
        ctx: Context<RecordSlice>,
        fruit_type: u8,
        slice_value: u16,
        timestamp: i64,
    ) -> Result<()> {
        instructions::record_slice(ctx, fruit_type, slice_value, timestamp)
    }

    pub fn commit_slices(ctx: Context<CommitSlices>) -> Result<()> {
        instructions::commit_slices(ctx)
    }

    pub fn submit_final_score(
        ctx: Context<SubmitFinalScore>,
        final_score: u64,
        timestamp: i64,
        signature: [u8; 64],
        recovery_id: u8,
    ) -> Result<()> {
        instructions::submit_final_score(ctx, final_score, timestamp, signature, recovery_id)
    }

    pub fn finalize_and_undelegate(ctx: Context<FinalizeAndUndelegate>) -> Result<()> {
        instructions::finalize_and_undelegate(ctx)
    }
}
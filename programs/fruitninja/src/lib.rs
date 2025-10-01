#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

// Ephemeral Rollups SDK imports (assumed available)
use ephemeral_rollups_sdk::anchor::{
    delegate,
    ephemeral,
};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{
    commit_accounts,
    commit_and_undelegate_accounts,
};

declare_id!("8LJqbPMhiDLp4vbzdfR7wHwY6VoYajzRkqafK9TS2HNB");

#[ephemeral]
#[program]
pub mod fruitninja {
    use super::*;

    /// Initialize a new game session for a player
    pub fn initialize_session(ctx: Context<InitializeSession>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let clock = Clock::get()?;
        
        session.player = ctx.accounts.player.key();
        session.bump = ctx.bumps.session;
        // Read defaults from config
        let config = &ctx.accounts.config;
        session.current_score = 0;
        session.combo = 0;
        session.lives = config.max_lives;
        session.is_active = true;
        session.started_at = clock.unix_timestamp;
        session.ended_at = None;
        session.fruits_sliced = 0;
        session.max_combo = 0;

        msg!("Session initialized for player: {}", session.player);

        // Emit session started event
        emit!(SessionStarted {
            player: session.player,
            timestamp: session.started_at,
        });

        Ok(())
    }

    /// Initialize player profile
    pub fn initialize_profile(ctx: Context<InitializeProfile>, username: String) -> Result<()> {
        require!(username.len() <= 32, ErrorCode::UsernameTooLong);
        
        let profile = &mut ctx.accounts.player_profile;
        profile.owner = ctx.accounts.player.key();
        profile.username = Some(username);
        profile.high_score = 0;
        profile.total_games = 0;
        profile.total_fruits_sliced = 0;
        profile.bump = ctx.bumps.player_profile;

        msg!("Profile created for: {}", profile.owner);
        
        Ok(())
    }

    /// Slice a fruit - increases score and combo
    pub fn slice_fruit(ctx: Context<SliceFruit>, points: u64) -> Result<()> {
        let session = &mut ctx.accounts.session;
        require!(session.is_active, ErrorCode::SessionNotActive);

        // Validate against config max points per fruit
        let config = &ctx.accounts.config;
        require!(points > 0 && points <= config.max_points_per_fruit, ErrorCode::InvalidPoints);
        
        session.combo = session.combo.saturating_add(1);
        if session.combo > session.max_combo {
            session.max_combo = session.combo;
        }
        
        // Use config combo multiplier base
        let combo_multiplier = config.combo_multiplier_base.saturating_add(session.combo as u64);
        let earned_points = points.saturating_mul(combo_multiplier).saturating_div(10);
        
        session.current_score = session.current_score.saturating_add(earned_points);
        session.fruits_sliced = session.fruits_sliced.saturating_add(1);

        msg!("Fruit sliced! Points: {}, Combo: {}, Total Score: {}", 
             earned_points, session.combo, session.current_score);

        // Emit FruitSliced event
        emit!(FruitSliced {
            player: session.player,
            points: earned_points,
            combo: session.combo,
            total_score: session.current_score,
        });

        Ok(())
    }

    /// Lose a life when player misses or hits a bomb
    pub fn lose_life(ctx: Context<LoseLife>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let clock = Clock::get()?;
        require!(session.is_active, ErrorCode::SessionNotActive);
        
        if session.lives > 0 {
            session.lives = session.lives.saturating_sub(1);
            msg!("Life lost! Remaining lives: {}", session.lives);
        }

        // Reset combo
        session.combo = 0;

        if session.lives == 0 {
            session.is_active = false;
            session.ended_at = Some(clock.unix_timestamp);
            msg!("Game Over! Final Score: {}", session.current_score);

            // Emit GameOver event
            let duration = session.ended_at.unwrap_or(clock.unix_timestamp) - session.started_at;
            emit!(GameOver {
                player: session.player,
                final_score: session.current_score,
                max_combo: session.max_combo,
                fruits_sliced: session.fruits_sliced,
                duration,
            });
        }

        Ok(())
    }

    /// End the session and update player profile and global leaderboard
    /// NOTE: This instruction requires the GameConfig PDA (so leaderboard can be updated).
    pub fn end_session(ctx: Context<EndSession>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let profile = &mut ctx.accounts.player_profile;
        let config = &mut ctx.accounts.config;
        let clock = Clock::get()?;
        
        if session.is_active {
            session.is_active = false;
            session.ended_at = Some(clock.unix_timestamp);
        }

        if session.current_score > profile.high_score {
            profile.high_score = session.current_score;
            msg!("New high score for player profile: {}!", profile.high_score);
        }
        
        profile.total_games = profile.total_games.saturating_add(1);
        profile.total_fruits_sliced = profile.total_fruits_sliced
            .saturating_add(session.fruits_sliced);

        msg!("Session ended. Final score: {}, Max combo: {}", 
             session.current_score, session.max_combo);

        // Emit GameOver event
        let duration = session.ended_at.unwrap_or(clock.unix_timestamp) - session.started_at;
        emit!(GameOver {
            player: session.player,
            final_score: session.current_score,
            max_combo: session.max_combo,
            fruits_sliced: session.fruits_sliced,
            duration,
        });

        // Submit to global leaderboard (mutates config.leaderboard)
        let entry = LeaderboardEntry {
            player: session.player,
            score: session.current_score,
            timestamp: clock.unix_timestamp,
        };
        update_leaderboard(config, entry)?;

        Ok(())
    }

    /// Delegate the session PDA to an ER validator
    pub fn delegate_session(ctx: Context<DelegateSession>) -> Result<()> {
    let session = &ctx.accounts.session;
    require!(session.is_active, ErrorCode::SessionNotActive);

    // NOTE: SDK's helper is named `delegate_session_pda` (per compiler hint)
    // and expects 4 args: payer, seeds, DelegateConfig, session_pda AccountInfo
    ctx.accounts.delegate_session_pda(
        &ctx.accounts.payer,                                           // payer signer
        &[SESSION_SEED, session.player.as_ref()],                      // seeds for the session PDA
        DelegateConfig {
            commit_frequency_ms: 30_000,
            validator: None,
        },


    )?;

    msg!("Session delegated to Ephemeral Rollup validator");
    Ok(())
}

    /// Undelegate and commit final state
    pub fn undelegate_session(ctx: Context<UndelegateSession>) -> Result<()> {
    let session = &ctx.accounts.session;

    msg!("Undelegating session for player: {}", session.player);

    // pass payer, vector of account infos to commit, magic_context, magic_program
    commit_and_undelegate_accounts(
        &ctx.accounts.payer,
        vec![&ctx.accounts.session.to_account_info()],
        &ctx.accounts.magic_context,
        &ctx.accounts.magic_program,
    )?;

    msg!("Session successfully undelegated and committed");
    Ok(())
}

    /// Periodic commit while still delegated (checkpoint)
    pub fn checkpoint_session(ctx: Context<CheckpointSession>) -> Result<()> {
    let session = &ctx.accounts.session;

    // NOTE: commit_accounts expects 4 args in this SDK version:
    // (magic_context, vec![accounts_to_commit], magic_program, payer_accountinfo)
    commit_accounts(
        &ctx.accounts.magic_context,
        vec![&ctx.accounts.session.to_account_info()],
        &ctx.accounts.magic_program,
        &ctx.accounts.payer.to_account_info(),
    )?;

    msg!(
        "Checkpoint committed for player: {} | Current Score: {} | Combo: {}",
        session.player,
        session.current_score,
        session.combo
    );

    emit!(SessionCheckpoint {
        player: session.player,
        current_score: session.current_score,
        combo: session.combo,
        fruits_sliced: session.fruits_sliced,
    });

    Ok(())
}

    /// Manual commit without undelegation (for periodic checkpoints)
    pub fn commit_session(ctx: Context<CommitSession>) -> Result<()> {
         commit_accounts(
        &ctx.accounts.magic_context,
        vec![&ctx.accounts.session.to_account_info()],
        &ctx.accounts.magic_program,
        &ctx.accounts.payer.to_account_info(),
    )?;
        
        msg!("Session state committed");
        Ok(())
    }

    /// Admin: initialize the global config PDA (one-time)
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        max_lives: u8,
        max_points_per_fruit: u64,
        combo_multiplier_base: u64,
        leaderboard_capacity: u8,
    ) -> Result<()> {
        require!(leaderboard_capacity as usize <= MAX_LEADERBOARD_CAPACITY, ErrorCode::LeaderboardCapacityTooLarge);
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.payer.key();
        config.max_lives = max_lives;
        config.max_points_per_fruit = max_points_per_fruit;
        config.combo_multiplier_base = combo_multiplier_base;
        config.leaderboard_capacity = leaderboard_capacity;
        config.bump = ctx.bumps.config;
        config.leaderboard = Vec::new();
        Ok(())
    }

    /// Admin: update global config params (only admin signer)
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        max_lives: Option<u8>,
        max_points_per_fruit: Option<u64>,
        combo_multiplier_base: Option<u64>,
        leaderboard_capacity: Option<u8>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        // Ensure caller is admin
        require!(ctx.accounts.admin.key() == config.admin, ErrorCode::Unauthorized);

        if let Some(ml) = max_lives {
            config.max_lives = ml;
        }
        if let Some(mp) = max_points_per_fruit {
            config.max_points_per_fruit = mp;
        }
        if let Some(cb) = combo_multiplier_base {
            config.combo_multiplier_base = cb;
        }
        if let Some(cap) = leaderboard_capacity {
            require!(cap as usize <= MAX_LEADERBOARD_CAPACITY, ErrorCode::LeaderboardCapacityTooLarge);
            config.leaderboard_capacity = cap;
            // If new capacity is smaller, truncate existing list
            let cap_usize = cap as usize;
            if config.leaderboard.len() > cap_usize {
                config.leaderboard.truncate(cap_usize);
            }
        }

        Ok(())
    }
}

// =================== Constants & Helpers ===================

pub const SESSION_SEED: &[u8] = b"session";
pub const PROFILE_SEED: &[u8] = b"profile";
pub const CONFIG_SEED: &[u8] = b"config";

// Maximum leaderboard size we preallocate storage for (compile-time constant)
pub const MAX_LEADERBOARD_CAPACITY: usize = 20;
// Entry size: Pubkey (32) + u64 (8) + i64 (8) = 48 bytes
pub const LEADERBOARD_ENTRY_SIZE: usize = 32 + 8 + 8;

// Compute GameConfig space:
// discriminator (8) + admin(32) + max_lives(1) + max_points(8) + combo_base(8)
// + leaderboard_capacity(1) + bump(1) + vec prefix (4) + MAX_LEADERBOARD_CAPACITY * ENTRY_SIZE + padding (8)
pub const GAME_CONFIG_MAX_LEN: usize = 8 + 32 + 1 + 8 + 8 + 1 + 1 + 4 + (MAX_LEADERBOARD_CAPACITY * LEADERBOARD_ENTRY_SIZE) + 8;

// Helper to update the leaderboard in-place (keeps it sorted desc and truncated)
fn update_leaderboard(config: &mut Account<GameConfig>, new_entry: LeaderboardEntry) -> Result<()> {
    let cap = config.leaderboard_capacity as usize;
    // Insert
    config.leaderboard.push(new_entry);
    // Sort descending
    config.leaderboard.sort_by(|a, b| b.score.cmp(&a.score));
    // Truncate to configured capacity
    if config.leaderboard.len() > cap {
        config.leaderboard.truncate(cap);
    }
    Ok(())
}

// =================== Account Types ===================

#[account]
pub struct GameSession {
    pub player: Pubkey,           // 32
    pub bump: u8,                 // 1
    pub current_score: u64,       // 8
    pub combo: u8,                // 1
    pub lives: u8,                // 1
    pub is_active: bool,          // 1
    pub started_at: i64,          // 8
    pub ended_at: Option<i64>,    // 1 + 8
    pub fruits_sliced: u64,       // 8
    pub max_combo: u8,            // 1
}

// Size: use earlier value (still reasonable)
impl GameSession {
    pub const LEN: usize = 8 + 32 + 1 + 8 + 1 + 1 + 1 + 8 + 9 + 8 + 1;
}

#[account]
pub struct PlayerProfile {
    pub owner: Pubkey,                  // 32
    pub username: Option<String>,       // 1 + 4 + 32 (max)
    pub high_score: u64,                // 8
    pub total_games: u64,               // 8
    pub total_fruits_sliced: u64,       // 8
    pub bump: u8,                       // 1
}

impl PlayerProfile {
    pub const LEN: usize = 8 + 32 + 37 + 8 + 8 + 8 + 1;
}

#[account]
pub struct GameConfig {
    pub admin: Pubkey,                  // 32
    pub max_lives: u8,                  // 1
    pub max_points_per_fruit: u64,      // 8
    pub combo_multiplier_base: u64,     // 8
    pub leaderboard_capacity: u8,       // 1
    pub bump: u8,                       // 1
    pub leaderboard: Vec<LeaderboardEntry>, // 4 + N * ENTRY_SIZE
}

// Precomputed max size (see GAME_CONFIG_MAX_LEN)
impl GameConfig {
    pub const LEN: usize = GAME_CONFIG_MAX_LEN;
}

// Leaderboard entry (serializable)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Debug)]
pub struct LeaderboardEntry {
    pub player: Pubkey,  // 32
    pub score: u64,      // 8
    pub timestamp: i64,  // 8
}

// =================== Account Contexts ===================

#[derive(Accounts)]
pub struct InitializeSession<'info> {
    #[account(
        init,
        payer = payer,
        space = GameSession::LEN,
        seeds = [SESSION_SEED, player.key().as_ref()],
        bump
    )]
    pub session: Account<'info, GameSession>,

    pub player: Signer<'info>,

    // We require config passed in to apply defaults at session init (not mandatory but convenient)
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, GameConfig>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeProfile<'info> {
    #[account(
        init,
        payer = payer,
        space = PlayerProfile::LEN,
        seeds = [PROFILE_SEED, player.key().as_ref()],
        bump
    )]
    pub player_profile: Account<'info, PlayerProfile>,

    pub player: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SliceFruit<'info> {
    #[account(
        mut,
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, GameSession>,

    // config read-only reference to validate points and multiplier
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, GameConfig>,
}

#[derive(Accounts)]
pub struct LoseLife<'info> {
    #[account(
        mut,
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, GameSession>,
}

#[derive(Accounts)]
pub struct EndSession<'info> {
    #[account(
        mut,
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump,
        has_one = player
    )]
    pub session: Account<'info, GameSession>,

    #[account(
        mut,
        seeds = [PROFILE_SEED, player.key().as_ref()],
        bump = player_profile.bump
    )]
    pub player_profile: Account<'info, PlayerProfile>,

    // Require config mut so we can update leaderboard
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, GameConfig>,

    pub player: Signer<'info>,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateSession<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: This is a PDA for session delegation. 
    /// Safety is guaranteed by the Ephemeral Rollups SDK; Anchor cannot type-check it.
    #[account(mut, del)]
    pub session_pda: AccountInfo<'info>,

    #[account(
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, GameSession>,
}


#[derive(Accounts)]
pub struct UndelegateSession<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, GameSession>,

    /// CHECK: Magic context account required by Ephemeral Rollups SDK.
    /// Anchor cannot verify this account. Safety is guaranteed by the SDK.
    #[account(mut)]
    pub magic_context: AccountInfo<'info>,

    /// CHECK: Ephemeral Rollups validator program account.
    /// Safety is guaranteed by the SDK; used only for commit/undelegate calls.
    pub magic_program: AccountInfo<'info>,
}


#[derive(Accounts)]
pub struct CheckpointSession<'info> {
    #[account(
        mut,
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, GameSession>,

    /// CHECK: Magic context account required by Ephemeral Rollups SDK.
    /// Anchor cannot verify this account. Safety is guaranteed by the SDK.
    #[account(mut)]
    pub magic_context: AccountInfo<'info>,

    /// CHECK: Ephemeral Rollups validator program account.
    /// Safety is guaranteed by the SDK; used only for commit/checkpoint calls.
    pub magic_program: AccountInfo<'info>,

    /// Payer / authority account required by the SDK helper
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CommitSession<'info> {
    #[account(
        mut,
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, GameSession>,

    /// CHECK: Magic context account required by Ephemeral Rollups SDK.
    /// Anchor cannot verify this account. Safety is guaranteed by the SDK.
    #[account(mut)]
    pub magic_context: AccountInfo<'info>,

    /// CHECK: Ephemeral Rollups validator program account.
    /// Safety is guaranteed by the SDK; used only for commit calls.
    pub magic_program: AccountInfo<'info>,

    /// Payer / authority account required by the SDK helper
    #[account(mut)]
    pub payer: Signer<'info>,
}


// InitializeConfig: admin creates the config PDA (one-time)
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(init, payer = payer, space = GameConfig::LEN, seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GameConfig>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// UpdateConfig: admin-only update
#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, GameConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,
}

// =================== Errors & Events ===================

#[error_code]
pub enum ErrorCode {
    #[msg("Session is not active")]
    SessionNotActive,

    #[msg("Invalid delegation state")]
    InvalidDelegation,

    #[msg("Invalid points value or exceeds config limit")]
    InvalidPoints,

    #[msg("Username too long (max 32 characters)")]
    UsernameTooLong,

    #[msg("Session already ended")]
    SessionAlreadyEnded,

    #[msg("Leaderboard capacity too large")]
    LeaderboardCapacityTooLarge,

    #[msg("Unauthorized")]
    Unauthorized,
}

#[event]
pub struct SessionStarted {
    pub player: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct FruitSliced {
    pub player: Pubkey,
    pub points: u64,
    pub combo: u8,
    pub total_score: u64,
}

#[event]
pub struct SessionCheckpoint {
    pub player: Pubkey,
    pub current_score: u64,
    pub combo: u8,
    pub fruits_sliced: u64,
}

#[event]
pub struct GameOver {
    pub player: Pubkey,
    pub final_score: u64,
    pub max_combo: u8,
    pub fruits_sliced: u64,
    pub duration: i64,
}

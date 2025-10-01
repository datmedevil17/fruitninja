use anchor_lang::prelude::*;

#[error_code]
pub enum GameError {
    #[msg("Game has already been finalized")]
    GameAlreadyFinalized,
    
    #[msg("Maximum number of slices reached")]
    MaxSlicesReached,
    
    #[msg("Invalid signature provided")]
    InvalidSignature,
    
    #[msg("Signature verification failed - signer mismatch")]
    SignatureVerificationFailed,
    
    #[msg("Unauthorized player")]
    UnauthorizedPlayer,
    
    #[msg("Game not finalized yet")]
    GameNotFinalized,
}
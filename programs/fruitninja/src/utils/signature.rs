use anchor_lang::prelude::*;
use anchor_lang::solana_program::{keccak, secp256k1_recover};
use crate::errors::GameError;

pub fn verify_backend_signature(
    player: Pubkey,
    game_id: u64,
    final_score: u64,
    timestamp: i64,
    signature: &[u8; 64],
    recovery_id: u8,
    expected_signer: Pubkey,
) -> Result<()> {
    let message = create_score_message(player, game_id, final_score, timestamp);
    let message_hash = keccak::hash(&message);
    
    let recovered_pubkey = secp256k1_recover::secp256k1_recover(
        &message_hash.to_bytes(),
        recovery_id,
        signature,
    ).map_err(|_| GameError::InvalidSignature)?;
    
    let recovered_key_bytes = &recovered_pubkey.to_bytes()[12..32];
    let expected_key_bytes = &expected_signer.to_bytes()[0..20];
    
    require!(
        recovered_key_bytes == expected_key_bytes,
        GameError::SignatureVerificationFailed
    );
    
    Ok(())
}

pub fn create_score_message(
    player: Pubkey,
    game_id: u64,
    final_score: u64,
    timestamp: i64,
) -> Vec<u8> {
    let mut message = Vec::new();
    message.extend_from_slice(player.as_ref());
    message.extend_from_slice(&game_id.to_le_bytes());
    message.extend_from_slice(&final_score.to_le_bytes());
    message.extend_from_slice(&timestamp.to_le_bytes());
    message
}

// services.ts
import { BN, Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionSignature
} from "@solana/web3.js";
import type { Fruitninja } from "../fruitninja";
import { OWNER_PROGRAM,DELEGATION_PROGRAM } from "../constants/programs";
import { MAGICBLOCK_RPC } from "@/utils/helpers";

/**
 * fetchGameSession: retrieves the current game session for a player
 */
export const fetchGameSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<any | null> => {
  try {
    const [sessionPda] = getSessionPda(program.programId, playerPublicKey);
    
    // Check if account exists first
    const accountInfo = await program.provider.connection.getAccountInfo(sessionPda);
    if (!accountInfo) {
      return null;
    }

    // Fetch the session data
    const session = await program.account.gameSession.fetch(sessionPda);
    
    return {
      ...session,
      sessionPda: sessionPda.toBase58(),
      isDelegated: !accountInfo.owner.equals(program.programId)
    };
  } catch (err: any) {
    // Handle account not found errors
    if (String(err).includes("Account does not exist") || 
        String(err).includes("AccountNotFound")) {
      return null;
    }
    throw err;
  }
};

/**
 * Helper: derive PDAs used by program
 */
export const getSessionPda = (programId: PublicKey, player: PublicKey): [PublicKey, number] =>
  PublicKey.findProgramAddressSync([Buffer.from("session"), player.toBuffer()], programId);

export const getConfigPda = (programId: PublicKey): [PublicKey, number] =>
  PublicKey.findProgramAddressSync([Buffer.from("config")], programId);



export const startGameSession = async (program: Program<Fruitninja>, player: PublicKey): Promise<string> => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = getSessionPda(program.programId, player);
  const [configPda] = getConfigPda(program.programId);

  // Check existing session
  try {
    const existingSession = await program.account.gameSession.fetch(sessionPda);
    if (existingSession.isActive) throw new Error("Player already has an active session");
  } catch (err: any) {
    // Anchor throws when account doesn't exist — that's ok for initializing
    if (!String(err).includes("Account does not exist") && !String(err).includes("AccountNotFound")) {
      throw err;
    }
  }

  const balance = await program.provider.connection.getBalance(player);
  if (balance < 0.01 * 1e9) throw new Error("Insufficient SOL balance");

  const tx = await program.methods
    .initializeSession()
    .accountsPartial({
      session: sessionPda,
      player,
      config: configPda,
      payer: player,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Session started:", tx);
  return tx;
};

/**
 * delegateSession: wallet-signed on-chain delegate. We do the same account list you had.
 * This returns the tx signature. We do NOT return magic context/pubkey in this unsafe flow.
 */
export const delegateSession = async (
  program: Program<Fruitninja>,
  player: PublicKey
): Promise<TransactionSignature> => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = getSessionPda(program.programId, player);

  // Ensure session exists and active
  const sessionInfo = await program.provider.connection.getAccountInfo(sessionPda);
  if (!sessionInfo) throw new Error("Session not initialized");
  const session = await program.account.gameSession.fetch(sessionPda);
  if (!session.isActive) throw new Error("Session is not active");

  // PDAs used by your original call (kept for compatibility)
  const [bufferSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("buffer"), sessionPda.toBuffer()],
    OWNER_PROGRAM
  );
  const [delegationRecordSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("delegation"), sessionPda.toBuffer()],
    DELEGATION_PROGRAM
  );
  const [delegationMetadataSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("delegation-metadata"), sessionPda.toBuffer()],
    DELEGATION_PROGRAM
  );

  console.log("Delegating session PDAs:", {
    sessionPda: sessionPda.toBase58(),
    bufferSessionPda: bufferSessionPda.toBase58(),
    delegationRecordSessionPda: delegationRecordSessionPda.toBase58(),
    delegationMetadataSessionPda: delegationMetadataSessionPda.toBase58(),
  });

  const tx = await program.methods
    .delegateSession()
    .accountsPartial({
      payer: player,
      bufferSession: bufferSessionPda,
      delegationRecordSession: delegationRecordSessionPda,
      delegationMetadataSession: delegationMetadataSessionPda,
      session: sessionPda,
      ownerProgram: OWNER_PROGRAM,
      delegationProgram: DELEGATION_PROGRAM,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Session delegated:", tx);

  // NOTE: insecure temp keypair derivation is done client-side when sending ephemeral txs
  return tx;
};

/**
 * sliceFruit: if session is delegated (owner != program.programId) -> use MagicBlock RPC + temp keypair derived from player's public key (unsafe).
 * Otherwise fall back to wallet-signed RPC.
 */
export const sliceFruit = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey,
  points: number
): Promise<string> => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = getSessionPda(program.programId, playerPublicKey);
  const [configPda] = getConfigPda(program.programId);

  // Ensure session exists and active
  try {
    const session = await program.account.gameSession.fetch(sessionPda);
    if (!session.isActive) throw new Error("Game session is not active");
  } catch (err) {
    throw new Error("No active game session found");
  }

  // Check account ownership to detect delegation (owner != program id indicates delegated)
  const accountInfo = await program.provider.connection.getAccountInfo(sessionPda);
  const delegated = !!accountInfo && !accountInfo.owner.equals(program.programId);

  if (delegated) {
    // UNSAFE: derive temp keypair deterministically from wallet public key bytes (devnet-only)
    const tempSeed = playerPublicKey.toBytes(); // 32 bytes
    const tempKeypair = Keypair.fromSeed(tempSeed);

    // Use MagicBlock ephemeral RPC
    const ephemeralConnection = new Connection(MAGICBLOCK_RPC, { commitment: "confirmed" });

    // Build transaction (unsigned) via Anchor
    const tx: Transaction = await program.methods
      .sliceFruit(new BN(points))
      .accounts({
        session: sessionPda,
        config: configPda,
      })
      .transaction();

    // Fill recent blockhash & fee payer from ephemeral RPC
    const {
      value: { blockhash, lastValidBlockHeight }
    } = await ephemeralConnection.getLatestBlockhashAndContext();

    tx.recentBlockhash = blockhash;
    tx.feePayer = tempKeypair.publicKey;

    // sign with tempKeypair (UNSAFE)
    tx.sign(tempKeypair);

    // send raw to MagicBlock RPC
    const raw = tx.serialize();
    const signature = await ephemeralConnection.sendRawTransaction(raw, { skipPreflight: true });
    await ephemeralConnection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, "confirmed");

    console.log("✅ Fruit sliced (ephemeral):", signature);
    return signature;
  } else {
    // fallback: wallet-signed Anchor rpc (wallet prompt)
    const signature = await program.methods
      .sliceFruit(new BN(points))
      .accountsPartial({
        session: sessionPda,
        config: configPda,
      })
      .rpc({ commitment: "confirmed" });

    console.log("✅ Fruit sliced (wallet):", signature);
    return signature;
  }
};

/**
 * loseLife: same pattern as sliceFruit
 */
export const loseLife = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = getSessionPda(program.programId, playerPublicKey);

  // Ensure session exists and active
  try {
    const session = await program.account.gameSession.fetch(sessionPda);
    if (!session.isActive) throw new Error("Game session is not active");
  } catch (err) {
    throw new Error("No active game session found");
  }

  const accountInfo = await program.provider.connection.getAccountInfo(sessionPda);
  const delegated = !!accountInfo && !accountInfo.owner.equals(program.programId);

  if (delegated) {
    const tempSeed = playerPublicKey.toBytes();
    const tempKeypair = Keypair.fromSeed(tempSeed);
    const ephemeralConnection = new Connection(MAGICBLOCK_RPC, { commitment: "confirmed" });

    const tx: Transaction = await program.methods
      .loseLife()
      .accounts({
        session: sessionPda,
      })
      .transaction();

    const {
      value: { blockhash, lastValidBlockHeight }
    } = await ephemeralConnection.getLatestBlockhashAndContext();

    tx.recentBlockhash = blockhash;
    tx.feePayer = tempKeypair.publicKey;
    tx.sign(tempKeypair);

    const raw = tx.serialize();
    const signature = await ephemeralConnection.sendRawTransaction(raw, { skipPreflight: true });
    await ephemeralConnection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, "confirmed");

    console.log("✅ Life lost (ephemeral):", signature);
    return signature;
  } else {
    const signature = await program.methods
      .loseLife()
      .accountsPartial({
        session: sessionPda,
      })
      .rpc({ commitment: "confirmed" });

    console.log("✅ Life lost (wallet):", signature);
    return signature;
  }
};

/**
 * endSession: wallet-signed finalize (leaderboard logic)
 */

export const undelegateAndEndSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
) => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = getSessionPda(program.programId, playerPublicKey);
  const [configPda] = getConfigPda(program.programId);

  // Fetch current account info
  const sessionInfo = await program.provider.connection.getAccountInfo(sessionPda);
  if (!sessionInfo) throw new Error("Session not initialized");

  const delegated = !sessionInfo.owner.equals(program.programId);

  // If delegated, undelegate first using PLAYER's wallet
  if (delegated) {
    console.log("Session is delegated. Undelegating with player wallet...");

    // Derive magic context (same as before, but we won't sign with it)
    const tempSeed = playerPublicKey.toBytes();
    const tempKeypair = Keypair.fromSeed(tempSeed);
    const magicContext = tempKeypair.publicKey;
    const magicProgram = new PublicKey("MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57");

    // Use PLAYER's wallet to undelegate (not ephemeral)
    const undelegateTx = await program.methods
      .undelegateSession()
      .accountsPartial({
        payer: program.provider.publicKey, // PLAYER wallet pays
        session: sessionPda,
        magicContext,
        magicProgram,
      })
      .rpc({ commitment: "confirmed" });

    console.log("✅ Session undelegated (wallet-signed):", undelegateTx);
    
    // Wait a moment for state to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Now ownership is back to your program — safe to call endSession
  const playerProfilePda = PublicKey.findProgramAddressSync(
    [Buffer.from("player-profile"), playerPublicKey.toBuffer()],
    program.programId
  )[0];

  const txSig = await program.methods.endSession()
    .accounts({
      session: sessionPda,
      player_profile: playerProfilePda,
      config: configPda,
      player: program.provider.publicKey,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Session ended successfully:", txSig);
  return txSig;
};






// const magicContext = tempKeypair.publicKey; // often a derived ephemeral account
/**
 * undelegateSession: try minimal accounts first (payer + session). If that fails, fall back to magicContext/magicProgram placeholder.
 * NOTE: we prefer minimal here (no magicContext required). If your on-chain IDL requires magicContext, we fall back to placeholders.
 */
export const undelegateSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = getSessionPda(program.programId, playerPublicKey);

  const sessionInfo = await program.provider.connection.getAccountInfo(sessionPda);
  if (!sessionInfo) throw new Error("Session not initialized");

  const delegated = !sessionInfo.owner.equals(program.programId);
  if (!delegated) throw new Error("Session is not delegated");

  const tempSeed = playerPublicKey.toBytes();
  const tempKeypair = Keypair.fromSeed(tempSeed);
  const magicContext = tempKeypair.publicKey;
  const magicProgram = new PublicKey("MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57");
  const ephemeralConnection = new Connection(MAGICBLOCK_RPC, { commitment: "confirmed" });

  const tx = await program.methods
    .undelegateSession()
    .accountsPartial({
      payer: tempKeypair.publicKey,
      session: sessionPda,
      magicContext,
      magicProgram,
    })
    .transaction();

  const { value: { blockhash, lastValidBlockHeight } } =
    await ephemeralConnection.getLatestBlockhashAndContext();

  tx.recentBlockhash = blockhash;
  tx.feePayer = tempKeypair.publicKey;

  tx.sign(tempKeypair);

  const raw = tx.serialize();
  const signature = await ephemeralConnection.sendRawTransaction(raw, { skipPreflight: true });
  await ephemeralConnection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, "confirmed");

  console.log("✅ Session undelegated (ephemeral):", signature);
  return signature;
};


// ...existing code...

/**
 * checkActiveSession: checks if a player has an active game session
 */
export const checkActiveSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<boolean> => {
  try {
    const session = await fetchGameSession(program, playerPublicKey);
    return session !== null && session.isActive;
  } catch (err: any) {
    console.warn("Error checking active session:", err);
    return false;
  }
};

// ...existing code...

// Example usage (to be removed in production)
// const program = ...; // your initialized program instance
// const playerPublicKey = ...; // player's public key

/**
 * checkSessionDelegated: checks if a session is currently delegated
 */
export const checkSessionDelegated = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<boolean> => {
  try {
    const [sessionPda] = getSessionPda(program.programId, playerPublicKey);
    
    const accountInfo = await program.provider.connection.getAccountInfo(sessionPda);
    if (!accountInfo) {
      console.log("❌ No session account found");
      return false;
    }

    // If account owner is not the program, it's delegated
    const isDelegated = !accountInfo.owner.equals(program.programId);
    
    console.log("🔍 Session delegation status:", {
      sessionPda: sessionPda.toBase58(),
      accountOwner: accountInfo.owner.toBase58(),
      programId: program.programId.toBase58(),
      isDelegated
    });

    return isDelegated;
  } catch (error) {
    console.error("Error checking delegation status:", error);
    return false;
  }
};

/**
 * getActiveSessionInfo: gets detailed info about active session and delegation status
 */
export const getActiveSessionInfo = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<{
  hasActiveSession: boolean;
  isDelegated: boolean;
  sessionData: any | null;
  delegationInfo: any;
}> => {
  try {
    const [sessionPda] = getSessionPda(program.programId, playerPublicKey);
    
    // Check if session account exists
    const accountInfo = await program.provider.connection.getAccountInfo(sessionPda);
    if (!accountInfo) {
      console.log("❌ No session found for player:", playerPublicKey.toBase58());
      return {
        hasActiveSession: false,
        isDelegated: false,
        sessionData: null,
        delegationInfo: { accountExists: false }
      };
    }

    // Fetch session data
    const sessionData = await program.account.gameSession.fetch(sessionPda);
    const isDelegated = !accountInfo.owner.equals(program.programId);
    
    const delegationInfo: {
      accountExists: boolean;
      accountOwner: string;
      programId: string;
      isDelegated: boolean;
      sessionPda: string;
      bufferAccount?: {
        pda: string;
        exists: boolean;
      };
    } = {
      accountExists: true,
      accountOwner: accountInfo.owner.toBase58(),
      programId: program.programId.toBase58(),
      isDelegated,
      sessionPda: sessionPda.toBase58()
    };

    // Check for delegation-related PDAs
    if (isDelegated) {
      try {
        const [bufferSessionPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("buffer"), sessionPda.toBuffer()],
          new PublicKey("BLCzHNMKKgDiawL1iNXozxstgrXLSNBrCvnrBewnDvdf") // BUFFER_PROGRAM
        );
        
        const bufferAccount = await program.provider.connection.getAccountInfo(bufferSessionPda);
        delegationInfo.bufferAccount = {
          pda: bufferSessionPda.toBase58(),
          exists: bufferAccount !== null
        };
      } catch (error) {
        console.warn("Error checking buffer account:", error);
      }
    }

    console.log("📊 Active Session Info:", {
      player: playerPublicKey.toBase58(),
      hasActiveSession: sessionData.isActive,
      isDelegated,
      sessionData: {
        currentScore: sessionData.currentScore?.toString(),
        combo: sessionData.combo,
        lives: sessionData.lives,
        isActive: sessionData.isActive,
        fruitsSliced: sessionData.fruitsSliced?.toString(),
        maxCombo: sessionData.maxCombo
      },
      delegationInfo
    });

    return {
      hasActiveSession: sessionData.isActive,
      isDelegated,
      sessionData,
      delegationInfo
    };
  } catch (error) {
    console.error("Error getting session info:", error);
    return {
      hasActiveSession: false,
      isDelegated: false,
      sessionData: null,
      delegationInfo: { error: String(error) }
    };
  }
};

/**
 * getConfigInfo: fetches and logs all game configuration details
 */
export const getConfigInfo = async (program: Program<Fruitninja>): Promise<any> => {
  try {
    const [configPda] = getConfigPda(program.programId);
    
    console.log("🔍 Fetching config from PDA:", configPda.toBase58());
    
    const config = await program.account.gameConfig.fetch(configPda);
    
    const configInfo = {
      pda: configPda.toBase58(),
      admin: config.admin.toBase58(),
      maxLives: config.maxLives,
      maxPointsPerFruit: config.maxPointsPerFruit?.toString(),
      comboMultiplierBase: config.comboMultiplierBase?.toString(),
      leaderboardCapacity: config.leaderboardCapacity,
      bump: config.bump,
      leaderboard: config.leaderboard?.map((entry: any, index: number) => ({
        rank: index + 1,
        player: entry.player.toBase58(),
        score: entry.score?.toString(),
        timestamp: new Date(entry.timestamp * 1000).toISOString()
      })) || []
    };

    console.log("⚙️ Game Configuration:", configInfo);
    console.log("🏆 Leaderboard Entries:", configInfo.leaderboard.length);
    
    if (configInfo.leaderboard.length > 0) {
      console.table(configInfo.leaderboard);
    }

    return configInfo;
  } catch (error) {
    console.error("❌ Error fetching config:", error);
    
    // Try to check if config account exists
    try {
      const [configPda] = getConfigPda(program.programId);
      const accountInfo = await program.provider.connection.getAccountInfo(configPda);
      
      if (!accountInfo) {
        console.log("❌ Config account does not exist. Need to initialize config first.");
      } else {
        console.log("✅ Config account exists but failed to deserialize:", {
          pda: configPda.toBase58(),
          owner: accountInfo.owner.toBase58(),
          dataLength: accountInfo.data.length
        });
      }
    } catch (innerError) {
      console.error("Error checking config account:", innerError);
    }
    
    throw error;
  }
};

/**
 * logAllSessionAndConfigInfo: comprehensive logging function
 */
export const logAllSessionAndConfigInfo = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<void> => {
  console.log("\n" + "=".repeat(50));
  console.log("📋 FRUIT NINJA SESSION & CONFIG REPORT");
  console.log("=".repeat(50));
  
  try {
    // Get config info
    console.log("\n🔧 CONFIGURATION INFO:");
    await getConfigInfo(program);
    
    // Get session info
    console.log("\n🎮 SESSION INFO:");
    await getActiveSessionInfo(program, playerPublicKey);
    
    // Additional delegation checks
    console.log("\n🔗 DELEGATION STATUS:");
    const isDelegated = await checkSessionDelegated(program, playerPublicKey);
    console.log(`Session is ${isDelegated ? 'DELEGATED' : 'NOT DELEGATED'}`);
    
  } catch (error) {
    console.error("❌ Error in comprehensive report:", error);
  }
  
  console.log("=".repeat(50) + "\n");
};
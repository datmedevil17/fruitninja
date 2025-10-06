import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionSignature,
} from "@solana/web3.js";
import idl from "./fruitninja.json";
import { getClusterURL } from "@/utils/helpers";

import type { Fruitninja } from "./fruitninja";

const CLUSTER: string = process.env.NEXT_PUBLIC_CLUSTER || "devnet";
const RPC_URL: string = getClusterURL(CLUSTER);

const OWNER_PROGRAM = new PublicKey("2yTboNmZbPJJey7Cf3mUyW1AyUc2m4rdWiCGg8qKMQq4");
const DELEGATION_PROGRAM = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");
const BUFFER_PROGRAM = new PublicKey("BLCzHNMKKgDiawL1iNXozxstgrXLSNBrCvnrBewnDvdf"); // matches IDL

export const getProvider = (
  publicKey: PublicKey | null,
  signTransaction: unknown,
  sendTransaction: unknown
): Program<Fruitninja> | null => {
  if (!publicKey || !signTransaction) {
    console.log("Wallet not connected or missing signTransaction");
    return null;
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(
    connection,
    { publicKey, signTransaction, sendTransaction } as unknown as Wallet,
    { commitment: "processed" }
  );

  return new Program<Fruitninja>(idl as Fruitninja, provider);
};

export const getProviderReadonly = (): Program<Fruitninja> => {
  const connection = new Connection(RPC_URL, "confirmed");

  const wallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => {
      throw new Error("Read-only provider cannot sign transactions.");
    },
    signAllTransactions: async () => {
      throw new Error("Read-only provider cannot sign transactions.");
    },
  };

  const provider = new AnchorProvider(connection, wallet as unknown as Wallet, { commitment: "processed" });
  return new Program<Fruitninja>(idl as Fruitninja, provider);
};

// Alternative version with different buffer PDA seeds

export const delegateSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<TransactionSignature> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Derive session PDA
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  // Try different buffer PDA derivation patterns
  // Option 1: Use "buffer" + player public key
  // const [bufferSessionPda] = PublicKey.findProgramAddressSync(
  //   [Buffer.from("buffer"), playerPublicKey.toBuffer()],
  //   BUFFER_PROGRAM
  // );

  // Option 2: If above doesn't work, try this alternative:
  const [bufferSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("buffer"), sessionPda.toBuffer()],
    BUFFER_PROGRAM
  );

  const [delegationRecordSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("delegation"), sessionPda.toBuffer()],
    DELEGATION_PROGRAM
  );

  const [delegationMetadataSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("delegation-metadata"), sessionPda.toBuffer()],
    DELEGATION_PROGRAM
  );

  console.log("=== PDA Derivation Debug ===");
  console.log("Session PDA:", sessionPda.toString());
  console.log("Buffer Session PDA:", bufferSessionPda.toString());
  console.log("Delegation Record PDA:", delegationRecordSessionPda.toString());
  console.log("Delegation Metadata PDA:", delegationMetadataSessionPda.toString());
  console.log("Player:", playerPublicKey.toString());
  console.log("Program ID:", program.programId.toString());

  // Validate session exists and is active
  try {
    const session = await program.account.gameSession.fetch(sessionPda);
    if (!session.isActive) {
      throw new Error("Session is not active");
    }
    console.log("Session validated:", session);
  } catch (error) {
    console.error("Error fetching session:", error);
    throw new Error("Session not found or invalid");
  }

  try {
    const txSignature = await program.methods
      .delegateSession()
      .accountsPartial({
        payer: playerPublicKey,
        bufferSessionPda,
        delegationRecordSessionPda,
        delegationMetadataSessionPda,
        sessionPda,
        session: sessionPda,
        ownerProgram: OWNER_PROGRAM,
        delegationProgram: DELEGATION_PROGRAM,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Session delegated successfully");
    console.log("✅ Transaction signature:", txSignature);

    return txSignature;
  } catch (error) {
    console.error("Delegation failed with error:", error);
    
    // If it's a seeds constraint error, let's try the alternative derivation
    if (error instanceof Error && error.message.includes("ConstraintSeeds")) {
      console.log("Trying alternative buffer PDA derivation...");
      
      // Try alternative buffer PDA derivation
      const [altBufferSessionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("buffer"), sessionPda.toBuffer()],
        BUFFER_PROGRAM
      );
      
      console.log("Alternative Buffer PDA:", altBufferSessionPda.toString());
      
      const altTxSignature = await program.methods
        .delegateSession()
        .accountsPartial({
          payer: playerPublicKey,
          bufferSessionPda: altBufferSessionPda,
          delegationRecordSessionPda,
          delegationMetadataSessionPda,
          sessionPda,
          session: sessionPda,
          ownerProgram: OWNER_PROGRAM,
          delegationProgram: DELEGATION_PROGRAM,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Session delegated with alternative PDA");
      console.log("✅ Transaction signature:", altTxSignature);
      return altTxSignature;
    }
    
    throw error;
  }
};

export const initializeConfig = async (
  program: Program<Fruitninja>,
  adminPublicKey: PublicKey,
  maxLives: number,
  maxPointsPerFruit: BN,
  comboMultiplierBase: BN,
  leaderboardCapacity: number
): Promise<TransactionSignature> => {
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  try {
    const existingConfig = await program.account.gameConfig.fetch(configPda);
    console.log("⚠️ Config already exists:", existingConfig);
    throw new Error(`Config is already initialized!`);
  } catch (err: any) {
    if (!err.message.includes("Account does not exist")) throw err;
  }

  const balance = await program.provider.connection.getBalance(adminPublicKey);
  if (balance < 0.01 * 1e9) throw new Error("Insufficient SOL balance.");

  const signature = await program.methods
    .initializeConfig(maxLives, maxPointsPerFruit, comboMultiplierBase, leaderboardCapacity)
    .accountsPartial({
      config: configPda,
      payer: adminPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Config initialized:", signature);
  await program.provider.connection.confirmTransaction(signature, "confirmed");
  return signature;
};

export const fetchConfig = async (program: Program<Fruitninja>): Promise<any> => {
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  try {
    const config = await program.account.gameConfig.fetch(configPda);
    console.log("Current config:", config);
    return config;
  } catch {
    console.log("Config does not exist yet");
    return null;
  }
};



export const initializeProfile = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey,
  username: string
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Validate username
  if (!username || username.trim().length === 0) {
    throw new Error("Username cannot be empty");
  }
  if (username.length > 32) {
    throw new Error("Username too long (max 32 characters)");
  }

  // Derive player profile PDA
  const [playerProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), playerPublicKey.toBuffer()],
    program.programId
  );

  console.log("Initializing profile for player:", playerPublicKey.toString());
  console.log("Profile PDA:", playerProfilePda.toString());
  console.log("Username:", username);

  // Check if profile already exists
  try {
    const existingProfile = await program.account.playerProfile.fetch(playerProfilePda);
    console.log("⚠️ Profile already exists:", existingProfile);
    throw new Error(`Profile already exists for player: ${playerPublicKey.toString()}`);
  } catch (err: any) {
    if (!err.message.includes("Account does not exist")) throw err;
  }

  // Check player's SOL balance
  const balance = await program.provider.connection.getBalance(playerPublicKey);
  if (balance < 0.01 * 1e9) {
    throw new Error("Insufficient SOL balance to create profile");
  }

  // Send transaction using Anchor's RPC (handles signing & confirmation automatically)
  const signature = await program.methods
    .initializeProfile(username.trim())
    .accountsPartial({
      playerProfile: playerProfilePda,
      player: playerPublicKey,
      payer: playerPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Profile initialized successfully:", signature);
  console.log("✅ Profile PDA:", playerProfilePda.toString());

  return signature;
};


export const fetchProfile = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<any> => {
  const [playerProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), playerPublicKey.toBuffer()],
    program.programId
  );

  try {
    const profile = await program.account.playerProfile.fetch(playerProfilePda);
    console.log("Player profile:", profile);
    return profile;
  } catch (error) {
    console.log("Profile does not exist for player:", playerPublicKey.toString());
    return null;
  }
};

export const checkProfileExists = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<boolean> => {
  const [playerProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), playerPublicKey.toBuffer()],
    program.programId
  );

  try {
    await program.account.playerProfile.fetch(playerProfilePda);
    return true;
  } catch {
    return false;
  }
};


// ...existing code...

export const startGameSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Derive session PDA
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  // Derive config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Starting game session for player:", playerPublicKey.toString());
  console.log("Session PDA:", sessionPda.toString());
  console.log("Config PDA:", configPda.toString());

  // Check if session already exists and is active
  try {
    const existingSession = await program.account.gameSession.fetch(sessionPda);
    if (existingSession.isActive) {
      console.log("⚠️ Active session already exists:", existingSession);
      throw new Error("Player already has an active game session");
    }
  } catch (err: any) {
    // If account doesn't exist, that's fine - we'll create a new one
    if (!err.message.includes("Account does not exist") && !err.message.includes("active game session")) {
      throw err;
    }
  }

  // Check if config exists
  try {
    const config = await program.account.gameConfig.fetch(configPda);
    console.log("Game config found:", config);
  } catch (error) {
    throw new Error("Game config not found. Please contact administrator.");
  }

  // Check player's SOL balance
  const balance = await program.provider.connection.getBalance(playerPublicKey);
  if (balance < 0.01 * 1e9) {
    throw new Error("Insufficient SOL balance to start game session");
  }

  // Initialize session
  const signature = await program.methods
    .initializeSession()
    .accountsPartial({
      session: sessionPda,
      player: playerPublicKey,
      config: configPda,
      payer: playerPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Game session initialized successfully:", signature);
  console.log("✅ Session PDA:", sessionPda.toString());

  return signature;
};

export const fetchGameSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<any> => {
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  try {
    const session = await program.account.gameSession.fetch(sessionPda);
    console.log("Game session:", session);
    return session;
  } catch (error) {
    console.log("No active session for player:", playerPublicKey.toString());
    return null;
  }
};

export const checkActiveSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<boolean> => {
  const session = await fetchGameSession(program, playerPublicKey);
  return session && session.isActive;
};

// ...existing code...

export const sliceFruit = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey,
  points: number
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Derive session PDA
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  // Derive config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Slicing fruit for player:", playerPublicKey.toString());
  console.log("Points:", points);

  // Validate session is active
  try {
    const session = await program.account.gameSession.fetch(sessionPda);
    if (!session.isActive) {
      throw new Error("Game session is not active");
    }
  } catch (error) {
    throw new Error("No active game session found");
  }

  // Slice fruit
  const signature = await program.methods
    .sliceFruit(new BN(points))
    .accountsPartial({
      session: sessionPda,
      config: configPda,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Fruit sliced successfully:", signature);
  return signature;
};

export const loseLife = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Derive session PDA
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  console.log("Player loses life:", playerPublicKey.toString());

  // Validate session is active
  try {
    const session = await program.account.gameSession.fetch(sessionPda);
    if (!session.isActive) {
      throw new Error("Game session is not active");
    }
  } catch (error) {
    throw new Error("No active game session found");
  }

  // Lose life
  const signature = await program.methods
    .loseLife()
    .accountsPartial({
      session: sessionPda,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Life lost:", signature);
  return signature;
};

export const endSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Derive session PDA
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  // Derive player profile PDA
  const [playerProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), playerPublicKey.toBuffer()],
    program.programId
  );

  // Derive config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Ending game session for player:", playerPublicKey.toString());

  // Validate session is active
  try {
    const session = await program.account.gameSession.fetch(sessionPda);
    if (!session.isActive) {
      throw new Error("Game session is already ended");
    }
  } catch (error) {
    throw new Error("No active game session found");
  }

  // End session
  const signature = await program.methods
    .endSession()
    .accountsPartial({
      session: sessionPda,
      playerProfile: playerProfilePda,
      config: configPda,
      player: playerPublicKey,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Game session ended successfully:", signature);
  return signature;
};

export const updateConfig = async (
  program: Program<Fruitninja>,
  adminPublicKey: PublicKey,
  maxLives?: number,
  maxPointsPerFruit?: BN,
  comboMultiplierBase?: BN,
  leaderboardCapacity?: number
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Derive config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Updating config by admin:", adminPublicKey.toString());

  // Check if config exists
  try {
    const config = await program.account.gameConfig.fetch(configPda);
    if (!config.admin.equals(adminPublicKey)) {
      throw new Error("Only admin can update config");
    }
  } catch (error) {
    throw new Error("Config not found or admin check failed");
  }

  // Update config
  const signature = await program.methods
    .updateConfig(
      maxLives || null,
      maxPointsPerFruit || null,
      comboMultiplierBase || null,
      leaderboardCapacity || null
    )
    .accountsPartial({
      config: configPda,
      admin: adminPublicKey,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Config updated successfully:", signature);
  return signature;
};

export const commitSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey,
  magicContext: PublicKey,
  magicProgram: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Derive session PDA
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  console.log("Committing session for player:", playerPublicKey.toString());

  // Commit session
  const signature = await program.methods
    .commitSession()
    .accountsPartial({
      session: sessionPda,
      magicContext: magicContext,
      magicProgram: magicProgram,
      payer: playerPublicKey,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Session committed successfully:", signature);
  return signature;
};

export const checkpointSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey,
  magicContext: PublicKey,
  magicProgram: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Derive session PDA
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  console.log("Checkpointing session for player:", playerPublicKey.toString());

  // Checkpoint session
  const signature = await program.methods
    .checkpointSession()
    .accountsPartial({
      session: sessionPda,
      magicContext: magicContext,
      magicProgram: magicProgram,
      payer: playerPublicKey,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Session checkpointed successfully:", signature);
  return signature;
};

export const undelegateSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey,
  magicContext: PublicKey,
  magicProgram: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Derive session PDA
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  console.log("Undelegating session for player:", playerPublicKey.toString());

  // Undelegate session
  const signature = await program.methods
    .undelegateSession()
    .accountsPartial({
      payer: playerPublicKey,
      session: sessionPda,
      magicContext: magicContext,
      magicProgram: magicProgram,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Session undelegated successfully:", signature);
  return signature;
};

export const processUndelegation = async (
  program: Program<Fruitninja>,
  baseAccount: PublicKey,
  buffer: PublicKey,
  payer: PublicKey,
  accountSeeds: Buffer[]
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  console.log("Processing undelegation for account:", baseAccount.toString());

  // Process undelegation
  const signature = await program.methods
    .processUndelegation(accountSeeds)
    .accountsPartial({
      baseAccount: baseAccount,
      buffer: buffer,
      payer: payer,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Undelegation processed successfully:", signature);
  return signature;
};

// Helper function to get leaderboard from config
export const fetchLeaderboard = async (
  program: Program<Fruitninja>
): Promise<any[]> => {
  const config = await fetchConfig(program);
  if (!config) {
    throw new Error("Game config not found");
  }
  
  console.log("Leaderboard:", config.leaderboard);
  return config.leaderboard || [];
};

// Helper function to get all player profiles (for admin purposes)
export const fetchAllProfiles = async (
  program: Program<Fruitninja>
): Promise<any[]> => {
  try {
    const profiles = await program.account.playerProfile.all();
    console.log("All player profiles:", profiles);
    return profiles;
  } catch (error) {
    console.error("Error fetching all profiles:", error);
    return [];
  }
};

// Helper function to get all active sessions (for admin purposes)
export const fetchAllSessions = async (
  program: Program<Fruitninja>
): Promise<any[]> => {
  try {
    const sessions = await program.account.gameSession.all();
    const activeSessions = sessions.filter(session => session.account.isActive);
    console.log("All active sessions:", activeSessions);
    return activeSessions;
  } catch (error) {
    console.error("Error fetching all sessions:", error);
    return [];
  }
};

// Helper function to check if player has enough lives
export const hasLivesRemaining = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<boolean> => {
  const session = await fetchGameSession(program, playerPublicKey);
  if (!session) return false;
  return session.lives > 0;
};

// Helper function to get current session stats
export const getSessionStats = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<{
  score: number;
  combo: number;
  lives: number;
  fruitsSliced: number;
  maxCombo: number;
  isActive: boolean;
} | null> => {
  const session = await fetchGameSession(program, playerPublicKey);
  if (!session) return null;

  return {
    score: session.currentScore?.toNumber() || 0,
    combo: session.combo || 0,
    lives: session.lives || 0,
    fruitsSliced: session.fruitsSliced?.toNumber() || 0,
    maxCombo: session.maxCombo || 0,
    isActive: session.isActive || false,
  };
};

// Helper function to calculate game duration
export const getGameDuration = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<number | null> => {
  const session = await fetchGameSession(program, playerPublicKey);
  if (!session || !session.startedAt) return null;

  const startTime = session.startedAt.toNumber();
  const endTime = session.endedAt?.toNumber() || Date.now() / 1000;
  
  return endTime - startTime;
};
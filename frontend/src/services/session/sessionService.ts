import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { Fruitninja } from "../fruitninja";

export const startGameSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Starting game session for player:", playerPublicKey.toString());
  console.log("Session PDA:", sessionPda.toString());
  console.log("Config PDA:", configPda.toString());

  try {
    const existingSession = await program.account.gameSession.fetch(sessionPda);
    if (existingSession.isActive) {
      console.log("⚠️ Active session already exists:", existingSession);
      throw new Error("Player already has an active game session");
    }
  } catch (err: any) {
    if (!err.message.includes("Account does not exist") && !err.message.includes("active game session")) {
      throw err;
    }
  }

  try {
    const config = await program.account.gameConfig.fetch(configPda);
    console.log("Game config found:", config);
  } catch (error) {
    throw new Error("Game config not found. Please contact administrator.");
  }

  const balance = await program.provider.connection.getBalance(playerPublicKey);
  if (balance < 0.01 * 1e9) {
    throw new Error("Insufficient SOL balance to start game session");
  }

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

export const endSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  const [playerProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), playerPublicKey.toBuffer()],
    program.programId
  );

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Ending game session for player:", playerPublicKey.toString());

  try {
    const session = await program.account.gameSession.fetch(sessionPda);
    if (!session.isActive) {
      throw new Error("Game session is already ended");
    }
  } catch (error) {
    throw new Error("No active game session found");
  }

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

export const commitSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey,
  magicContext: PublicKey,
  magicProgram: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  console.log("Committing session for player:", playerPublicKey.toString());

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

  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  console.log("Checkpointing session for player:", playerPublicKey.toString());

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
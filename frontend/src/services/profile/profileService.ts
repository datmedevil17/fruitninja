import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { Fruitninja } from "../fruitninja";

export const initializeProfile = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey,
  username: string
): Promise<string> => {
  if (!program.provider.publicKey) {
    throw new Error("Wallet not connected");
  }

  if (!username || username.trim().length === 0) {
    throw new Error("Username cannot be empty");
  }
  if (username.length > 32) {
    throw new Error("Username too long (max 32 characters)");
  }

  const [playerProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), playerPublicKey.toBuffer()],
    program.programId
  );

  console.log("Initializing profile for player:", playerPublicKey.toString());
  console.log("Profile PDA:", playerProfilePda.toString());
  console.log("Username:", username);

  try {
    const existingProfile = await program.account.playerProfile.fetch(playerProfilePda);
    console.log("⚠️ Profile already exists:", existingProfile);
    throw new Error(`Profile already exists for player: ${playerPublicKey.toString()}`);
  } catch (err: any) {
    if (!err.message.includes("Account does not exist")) throw err;
  }

  const balance = await program.provider.connection.getBalance(playerPublicKey);
  if (balance < 0.01 * 1e9) {
    throw new Error("Insufficient SOL balance to create profile");
  }

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
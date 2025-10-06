import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionSignature } from "@solana/web3.js";
import type { Fruitninja } from "../fruitninja";

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

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Updating config by admin:", adminPublicKey.toString());

  try {
    const config = await program.account.gameConfig.fetch(configPda);
    if (!config.admin.equals(adminPublicKey)) {
      throw new Error("Only admin can update config");
    }
  } catch (error) {
    throw new Error("Config not found or admin check failed");
  }

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
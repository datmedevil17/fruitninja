import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Fruitninja } from "../fruitninja";

export const sliceFruit = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey,
  points: number
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

  console.log("Slicing fruit for player:", playerPublicKey.toString());
  console.log("Points:", points);

  try {
    const session = await program.account.gameSession.fetch(sessionPda);
    if (!session.isActive) {
      throw new Error("Game session is not active");
    }
  } catch (error) {
    throw new Error("No active game session found");
  }

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

  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  console.log("Player loses life:", playerPublicKey.toString());

  try {
    const session = await program.account.gameSession.fetch(sessionPda);
    if (!session.isActive) {
      throw new Error("Game session is not active");
    }
  } catch (error) {
    throw new Error("No active game session found");
  }

  const signature = await program.methods
    .loseLife()
    .accountsPartial({
      session: sessionPda,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Life lost:", signature);
  return signature;
};
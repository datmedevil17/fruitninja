import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionSignature } from "@solana/web3.js";
import type { Fruitninja } from "../fruitninja";
import { OWNER_PROGRAM, DELEGATION_PROGRAM, BUFFER_PROGRAM } from "../constants/programs";

export const delegateSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<TransactionSignature> => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

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

  // Fetch session to confirm validity
  const session = await program.account.gameSession.fetchNullable(sessionPda);
  if (!session || !session.isActive) {
    throw new Error("Session not found or inactive");
  }

  // Execute delegation
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

    console.log("✅ Session delegated successfully:", txSignature);
    return txSignature;
  } catch (err) {
    console.error("Delegation failed:", err);
    throw err;
  }
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

  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  console.log("Undelegating session for player:", playerPublicKey.toString());

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
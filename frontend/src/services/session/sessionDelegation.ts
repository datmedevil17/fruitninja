import {
  AnchorProvider,
  Program,
  Wallet,
} from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionSignature,
} from "@solana/web3.js";
import type { Fruitninja } from "../fruitninja";
import idl from "../fruitninja.json";
import { getClusterURL } from "@/utils/helpers";
import {
  OWNER_PROGRAM,
  DELEGATION_PROGRAM,
  BUFFER_PROGRAM,
} from "../constants/programs";

const CLUSTER: string = process.env.NEXT_PUBLIC_CLUSTER || "devnet";
const RPC_URL: string = getClusterURL(CLUSTER);

/**
 * Delegates the current player's session to the Ephemeral Rollup validator.
 */
export const delegateSession = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<TransactionSignature> => {
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );

  // sanity check: ensure session is initialized
  const sessionAccountInfo = await program.provider.connection.getAccountInfo(sessionPda);
  if (!sessionAccountInfo) {
    throw new Error("❌ Session not initialized. Start a session first.");
  }

  // derive buffer and delegation PDAs
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

  console.log("Delegating session:", sessionPda.toString());
  await debugSessionPDAs(program, playerPublicKey);

  const tx = await program.methods
    .delegateSession()
    .accountsPartial({
      payer: playerPublicKey,
      bufferSessionPda,
      delegationRecordSessionPda,
      delegationMetadataSessionPda,
      sessionPda, // same as below
      session: sessionPda, // same GameSession PDA
      ownerProgram: OWNER_PROGRAM,
      delegationProgram: DELEGATION_PROGRAM,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Delegation TX:", tx);
  return tx;
};


/**
 * Undelegates an active session from the Ephemeral Rollup validator.
 */
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
      magicContext,
      magicProgram,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Session undelegated successfully:", signature);
  return signature;
};

/**
 * Processes an undelegation confirmation (final step).
 */
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
      baseAccount,
      buffer,
      payer,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Undelegation processed successfully:", signature);
  return signature;
};


/**
 * Debug function to log expected vs actual PDAs for session delegation
 */
export const debugSessionPDAs = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
) => {
  console.log("=== Debugging PDAs for player:", playerPublicKey.toString(), "===");

  // session PDA
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), playerPublicKey.toBuffer()],
    program.programId
  );
  console.log("sessionPda:", sessionPda.toString());

  // bufferSessionPda
  const [bufferSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("buffer"), sessionPda.toBuffer()],
    BUFFER_PROGRAM
  );
  console.log("bufferSessionPda:", bufferSessionPda.toString(), "expected by IDL?");

  // delegationRecordSessionPda
  const [delegationRecordSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("delegation"), sessionPda.toBuffer()],
    DELEGATION_PROGRAM
  );
  console.log("delegationRecordSessionPda:", delegationRecordSessionPda.toString());

  // delegationMetadataSessionPda
  const [delegationMetadataSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("delegation-metadata"), sessionPda.toBuffer()],
    DELEGATION_PROGRAM
  );
  console.log("delegationMetadataSessionPda:", delegationMetadataSessionPda.toString());

  // check if accounts exist on-chain
  const bufferAccountInfo = await program.provider.connection.getAccountInfo(bufferSessionPda);
  console.log("bufferSessionPda exists on-chain?", !!bufferAccountInfo);

  const sessionAccountInfo = await program.provider.connection.getAccountInfo(sessionPda);
  console.log("sessionPda exists on-chain?", !!sessionAccountInfo);

  console.log("=== End debug ===");
};

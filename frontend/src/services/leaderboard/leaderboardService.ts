import { Program } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Fruitninja } from "../fruitninja";
import { fetchConfig } from "../config/configService";

// Define the LeaderboardEntry type
interface LeaderboardEntry {
  player: PublicKey;
  score: BN;
  timestamp: BN;
}

export const fetchLeaderboard = async (
  program: Program<Fruitninja>
): Promise<LeaderboardEntry[]> => {
  const config = await fetchConfig(program);
  if (!config) {
    throw new Error("Game config not found");
  }
  
  console.log("Leaderboard:", config.leaderboard);
  return config.leaderboard || [];
};
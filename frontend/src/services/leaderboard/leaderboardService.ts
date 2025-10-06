import { Program } from "@coral-xyz/anchor";
import type { Fruitninja } from "../fruitninja";
import { fetchConfig } from "../config/configService";

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
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Fruitninja } from "../fruitninja";
import { fetchGameSession } from "../session/sessionService";

export const hasLivesRemaining = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<boolean> => {
  const session = await fetchGameSession(program, playerPublicKey);
  if (!session) return false;
  return session.lives > 0;
};

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

export const getGameDuration = async (
  program: Program<Fruitninja>,
  playerPublicKey: PublicKey
): Promise<number | null> => {
  const session = await fetchGameSession(program, playerPublicKey);
  if (!session || !session.startTime) return null;

  const startTime = session.startTime.toNumber();
  const endTime = session.endTime?.toNumber() || Date.now() / 1000;
  
  return endTime - startTime;
};
// Providers
export { getProvider, getProviderReadonly } from './providers/anchorProvider';

// Constants
export { OWNER_PROGRAM, DELEGATION_PROGRAM } from './constants/programs';

// Config
export { initializeConfig, fetchConfig, updateConfig } from './config/configService';

// Profile
export { 
  initializeProfile, 
  fetchProfile, 
  checkProfileExists, 
  fetchAllProfiles 
} from './profile/profileService';

// Session
export { 
  startGameSession, 
  fetchGameSession, 
  checkActiveSession, 
  undelegateAndEndSession, 
  sliceFruit,
  loseLife,
  delegateSession,
  undelegateSession,
  checkSessionDelegated,
  getActiveSessionInfo,
  getConfigInfo,
} from './session/sessionService';

// Game Actions

// Leaderboard
export { fetchLeaderboard } from './leaderboard/leaderboardService';

// Utils
export { 
  hasLivesRemaining, 
  getSessionStats, 
  getGameDuration 
} from './utils/helpers';

// Types
export type { Fruitninja } from './fruitninja';


export interface Point {
  x: number;
  y: number;
}

export interface Fruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  type: string;
  emoji: string;
  sliced: boolean;
  sliceTime?: number;
}

export interface Powerup {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  type: 'slow' | 'double' | 'bomb' | 'freeze';
  emoji: string;
  color: string;
  sliced: boolean;
  sliceTime?: number;
}

export interface GameStartOverlayProps {
  onStartGame: () => void;
  isProcessing: boolean;
}
export interface GameOverOverlayProps {
  score: number;
  onPlayAgain: () => void;
  isProcessing?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface SlashTrail {
  points: Point[];
  timestamp: number;
}

export interface ActivePowerup {
  type: string;
  endTime: number;
}

export interface GameCanvasProps {
  canvasSize: { width: number; height: number };
  fruits: Fruit[];
  powerups: Powerup[];
  particles: Particle[];
  slashTrails: SlashTrail[];
  activePowerups: ActivePowerup[];
  gameStarted: boolean;
  gameOver: boolean;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchEnd: () => void;
}

// Game Constants
export const FRUIT_TYPES = [
  { type: 'apple', emoji: '🍎', color: '#ff4444' },
  { type: 'orange', emoji: '🍊', color: '#ff8800' },
  { type: 'banana', emoji: '🍌', color: '#ffff00' },
  { type: 'watermelon', emoji: '🍉', color: '#00ff44' },
  { type: 'pineapple', emoji: '🍍', color: '#ffaa00' },
  { type: 'strawberry', emoji: '🍓', color: '#ff0044' },
  { type: 'grapes', emoji: '🍇', color: '#8800ff' },
  { type: 'peach', emoji: '🍑', color: '#ffaa88' },
];

export const POWERUP_TYPES = [
  { type: 'slow', emoji: '⏰', color: '#4444ff', name: 'Slow Motion' },
  { type: 'double', emoji: '💎', color: '#ffaa00', name: 'Double Points' },
  { type: 'bomb', emoji: '💣', color: '#ff0000', name: 'Bomb' },
  { type: 'freeze', emoji: '❄️', color: '#00aaff', name: 'Freeze' },
];

export const GRAVITY = 0.3; // Reduced from 0.5

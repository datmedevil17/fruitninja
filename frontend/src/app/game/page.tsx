'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import GameCanvas from '../../components/GameCanvas';
import GameHeader from '../../components/GameHeader';
import PowerupsDisplay from '../../components/PowerupsDisplay';
import GameStartOverlay from '../../components/GameStartOverlay';
import GameOverOverlay from '../../components/GameOverOverlay';
import GameTips from '../../components/GameTips';
import { Point,Fruit,Powerup,ActivePowerup,Particle,SlashTrail,FRUIT_TYPES,POWERUP_TYPES,GRAVITY } from '@/types/game';
import { 
  delegateSession, 
  sliceFruit as blockchainSliceFruit, 
  loseLife as blockchainLoseLife, 
  undelegateAndEndSession as blockchainEndSession, 
  getProvider, 
  fetchGameSession, 
  checkSessionDelegated,
} from '@/services';

// Enhanced Toast notification component
const Toast = ({ 
  message, 
  type, 
  onClose, 
  txHash 
}: { 
  message: string; 
  type: 'success' | 'error' | 'processing'; 
  onClose: () => void;
  txHash?: string;
}) => {
  useEffect(() => {
    if (type !== 'processing') {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'processing': return '●';
      default: return '●';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'error': return 'bg-red-50 border-red-200 text-red-700';
      case 'processing': return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className={`rounded-lg border shadow-sm p-4 max-w-sm transition-all duration-300 ${getColors()}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${type === 'processing' ? 'animate-pulse' : ''}`}>
          <div className="w-5 h-5 rounded-full bg-current opacity-20 flex items-center justify-center">
            <span className="text-xs font-medium">{getIcon()}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
          {txHash && (
            <p className="text-xs opacity-70 mt-1 font-mono">
              {txHash.slice(0, 8)}...{txHash.slice(-8)}
            </p>
          )}
        </div>
        {type !== 'processing' && (
          <button 
            onClick={onClose} 
            className="flex-shrink-0 p-1 hover:bg-current hover:bg-opacity-10 rounded transition-colors"
          >
            <span className="sr-only">Close</span>
            <span className="text-xs">✕</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Enhanced Toast container
const ToastContainer = ({ toasts, removeToast }: { 
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'processing';
    txHash?: string;
  }>;
  removeToast: (id: string) => void;
}) => {
  return (
    <div className="fixed top-6 right-6 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          txHash={toast.txHash}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Professional Score Screen
const ScoreScreen = ({ 
  score, 
  onEndAndGoHome, 
  isProcessing 
}: { 
  score: number; 
  onEndAndGoHome: () => void; 
  isProcessing: boolean;
}) => {
  const getRankFromScore = (score: number) => {
    if (score >= 1000) return { title: "Ninja Master", icon: "🥇" };
    if (score >= 500) return { title: "Fruit Warrior", icon: "🥈" };
    if (score >= 300) return { title: "Sharp Shooter", icon: "🥉" };
    if (score >= 200) return { title: "Getting Better", icon: "⭐" };
    if (score >= 100) return { title: "Keep Practicing", icon: "💪" };
    return { title: "Try Again", icon: "🎯" };
  };

  const rank = getRankFromScore(score);

  return (
    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4 shadow-xl border border-slate-200">
        <div className="mb-6">
          <div className="text-6xl mb-4">{rank.icon}</div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Game Complete</h2>
          <div className="text-4xl font-bold text-slate-900 mb-2">{score.toLocaleString()}</div>
          <p className="text-slate-600 font-medium">{rank.title}</p>
        </div>
        
        <button
          onClick={onEndAndGoHome}
          disabled={isProcessing}
          className="w-full bg-slate-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Ending Session...
            </span>
          ) : (
            'End Game & Return Home'
          )}
        </button>
      </div>
    </div>
  );
};

export default function FruitNinja() {
  const router = useRouter();
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 });
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [powerups, setPowerups] = useState<Powerup[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(5);
  const [slashTrails, setSlashTrails] = useState<SlashTrail[]>([]);
  const [isSlashing, setIsSlashing] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });
  const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([]);
  const [multiplier, setMultiplier] = useState(1);

  // Blockchain states
  const [isSessionDelegated, setIsSessionDelegated] = useState(false);
  const [isProcessingBlockchain, setIsProcessingBlockchain] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'processing';
    txHash?: string;
  }>>([]);

  // Simplified state - just one score screen
  const [showScoreScreen, setShowScoreScreen] = useState(false);

  // Toast management functions
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'processing', txHash?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, txHash }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, message: string, type: 'success' | 'error', txHash?: string) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, message, type, txHash } : toast
    ));
  }, []);

  // Check wallet connection and redirect if not connected
  useEffect(() => {
    if (!publicKey) {
      router.push('/');
      return;
    }
  }, [publicKey, router]);

  // Fetch initial session state and check delegation status
  useEffect(() => {
    const fetchSessionState = async () => {
      if (!publicKey || !signTransaction || !sendTransaction) return;

      try {
        const program = getProvider(publicKey, signTransaction, sendTransaction);
        if (!program) return;

        const session = await fetchGameSession(program, publicKey);
        if (session && session.isActive) {
          // Use the proper function to check if session is delegated
          const isDelegated = await checkSessionDelegated(program, publicKey);
          setIsSessionDelegated(isDelegated);
          setScore(session.currentScore?.toNumber() || 0);
          setLives(session.lives || 5);
          console.log('Session status - Active:', session.isActive, 'Delegated:', isDelegated);
        }
      } catch (error) {
        console.error('Error fetching session state:', error);
      }
    };

    fetchSessionState();
  }, [publicKey, signTransaction, sendTransaction]);

  // Responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 48;
        const maxWidth = Math.min(containerWidth, 1000);
        const aspectRatio = 10 / 7;
        const width = maxWidth;
        const height = width / aspectRatio;
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const getTimeMultiplier = useCallback(() => {
    const slowActive = activePowerups.find(p => p.type === 'slow');
    const freezeActive = activePowerups.find(p => p.type === 'freeze');
    
    if (freezeActive) return 0;
    if (slowActive) return 0.3;
    return 1;
  }, [activePowerups]);

  // Reduced fruit spawn rate and speed
  const spawnFruit = useCallback(() => {
    const fruitType = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    const size = Math.random() * 15 + 35;
    
    const margin = size / 2 + 20;
    const x = Math.random() * (canvasSize.width - 2 * margin) + margin;
    const y = canvasSize.height + 50;
    
    // Reduced horizontal speed
    const maxHorizontalSpeed = 1.2; // Reduced from 2
    const vx = (Math.random() - 0.5) * maxHorizontalSpeed;
    // Reduced vertical speed
    const vy = -Math.random() * 6 - 8; // Reduced from 8-10 to 6-8
    
    const newFruit: Fruit = {
      id: Date.now() + Math.random(),
      x,
      y,
      vx,
      vy,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1, // Reduced rotation speed
      size,
      type: fruitType.type,
      emoji: fruitType.emoji,
      sliced: false,
    };

    setFruits(prev => [...prev, newFruit]);
  }, [canvasSize]);

  const spawnPowerup = useCallback(() => {
    const powerupType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    const size = 30;
    
    const margin = size / 2 + 15;
    const x = Math.random() * (canvasSize.width - 2 * margin) + margin;
    const y = canvasSize.height + 50;
    
    // Reduced powerup speed
    const vx = (Math.random() - 0.5) * 1.0; // Reduced from 1.5
    const vy = -Math.random() * 5 - 6; // Reduced from 6-8 to 5-6
    
    const newPowerup: Powerup = {
      id: Date.now() + Math.random(),
      x,
      y,
      vx,
      vy,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.08, // Reduced rotation speed
      size,
      type: powerupType.type as 'slow' | 'double' | 'bomb' | 'freeze',
      emoji: powerupType.emoji,
      color: powerupType.color,
      sliced: false,
    };

    setPowerups(prev => [...prev, newPowerup]);
  }, [canvasSize]);

  const createParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        maxLife: Math.random() * 25 + 15,
        color,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Enhanced blockchain function to slice fruit with toast notifications
  const handleSliceFruitBlockchain = useCallback(async (points: number) => {
    if (!publicKey || !signTransaction || !sendTransaction || !isSessionDelegated) return;

    const toastId = addToast('Processing slice transaction...', 'processing');

    try {
      setIsProcessingBlockchain(true);
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) throw new Error('Failed to get program provider');

      const signature = await blockchainSliceFruit(program, publicKey, points);
      console.log(`✅ Sliced fruit on blockchain with ${points} points`);
      
      updateToast(toastId, `Fruit sliced! +${points} points`, 'success', signature);
    } catch (error) {
      console.error('Error slicing fruit on blockchain:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSessionError(`Failed to record slice: ${errorMessage}`);
      updateToast(toastId, `Slice failed: ${errorMessage}`, 'error');
    } finally {
      setIsProcessingBlockchain(false);
    }
  }, [publicKey, signTransaction, sendTransaction, isSessionDelegated, addToast, updateToast]);

  // Enhanced blockchain function to lose life with toast notifications
  const handleLoseLifeBlockchain = useCallback(async () => {
    if (!publicKey || !signTransaction || !sendTransaction || !isSessionDelegated) return;

    const toastId = addToast('Processing life loss...', 'processing');

    try {
      setIsProcessingBlockchain(true);
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) throw new Error('Failed to get program provider');

      const signature = await blockchainLoseLife(program, publicKey);
      console.log('✅ Lost life on blockchain');
      
      updateToast(toastId, 'Life lost! Be more careful!', 'success', signature);
    } catch (error) {
      console.error('Error losing life on blockchain:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSessionError(`Failed to record life loss: ${errorMessage}`);
      updateToast(toastId, `Life loss failed: ${errorMessage}`, 'error');
    } finally {
      setIsProcessingBlockchain(false);
    }
  }, [publicKey, signTransaction, sendTransaction, isSessionDelegated, addToast, updateToast]);

  const activatePowerup = useCallback((type: string) => {
    const now = Date.now();
    let duration = 5000;

    switch (type) {
      case 'slow':
        duration = 8000;
        break;
      case 'double':
        duration = 10000;
        break;
      case 'bomb':
        // Slice all fruits on screen
        setFruits(prev => prev.map(fruit => {
          if (!fruit.sliced) {
            const fruitType = FRUIT_TYPES.find(f => f.type === fruit.type);
            createParticles(fruit.x, fruit.y, fruitType?.color || '#ff0000');
            const points = 10 * multiplier;
            setScore(s => s + points);
            // Call blockchain slice for each fruit
            handleSliceFruitBlockchain(points);
            return { ...fruit, sliced: true, sliceTime: now };
          }
          return fruit;
        }));
        return;
      case 'freeze':
        duration = 6000;
        break;
    }

    setActivePowerups(prev => {
      const filtered = prev.filter(p => p.type !== type);
      return [...filtered, { type, endTime: now + duration }];
    });
  }, [multiplier, createParticles, handleSliceFruitBlockchain]);

  const checkSlice = useCallback((mouseX: number, mouseY: number, prevX: number, prevY: number) => {
    const doubleActive = activePowerups.find(p => p.type === 'double');
    const currentMultiplier = doubleActive ? 2 : 1;
    setMultiplier(currentMultiplier);

    let slicedAnyFruit = false;

    // Check fruit slicing
    setFruits(prev => prev.map(fruit => {
      if (fruit.sliced) return fruit;

      const lineLength = Math.sqrt((mouseX - prevX) ** 2 + (mouseY - prevY) ** 2);
      if (lineLength > 0) {
        const t = Math.max(0, Math.min(1, 
          ((fruit.x - prevX) * (mouseX - prevX) + (fruit.y - prevY) * (mouseY - prevY)) / (lineLength ** 2)
        ));
        const closestX = prevX + t * (mouseX - prevX);
        const closestY = prevY + t * (mouseY - prevY);
        const closestDistance = Math.sqrt((closestX - fruit.x) ** 2 + (closestY - fruit.y) ** 2);
        
        if (closestDistance < fruit.size / 2) {
          const fruitType = FRUIT_TYPES.find(f => f.type === fruit.type);
          createParticles(fruit.x, fruit.y, fruitType?.color || '#ff0000');
          const points = 10 * currentMultiplier;
          setScore(s => s + points);
          slicedAnyFruit = true;
          
          // Call blockchain slice fruit
          handleSliceFruitBlockchain(points);
          
          return { ...fruit, sliced: true, sliceTime: Date.now() };
        }
      }
      return fruit;
    }));

    // Check powerup slicing
    setPowerups(prev => prev.map(powerup => {
      if (powerup.sliced) return powerup;

      const lineLength = Math.sqrt((mouseX - prevX) ** 2 + (mouseY - prevY) ** 2);
      if (lineLength > 0) {
        const t = Math.max(0, Math.min(1, 
          ((powerup.x - prevX) * (mouseX - prevX) + (powerup.y - prevY) * (mouseY - prevY)) / (lineLength ** 2)
        ));
        const closestX = prevX + t * (mouseX - prevX);
        const closestY = prevY + t * (mouseY - prevY);
        const closestDistance = Math.sqrt((closestX - powerup.x) ** 2 + (closestY - powerup.y) ** 2);
        
        if (closestDistance < powerup.size / 2) {
          createParticles(powerup.x, powerup.y, powerup.color);
          activatePowerup(powerup.type);
          return { ...powerup, sliced: true, sliceTime: Date.now() };
        }
      }
      return powerup;
    }));
  }, [activePowerups, createParticles, activatePowerup, handleSliceFruitBlockchain]);

  const getMousePosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, [canvasSize]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted || gameOver) return;

    const { x: mouseX, y: mouseY } = getMousePosition(e);

    if (isSlashing) {
      checkSlice(mouseX, mouseY, lastMousePos.x, lastMousePos.y);
      
      setSlashTrails(prev => {
        const newTrail = { points: [{ x: mouseX, y: mouseY }], timestamp: Date.now() };
        const updatedTrails = prev.map(trail => ({
          ...trail,
          points: [...trail.points, { x: mouseX, y: mouseY }].slice(-8)
        }));
        return [...updatedTrails, newTrail].slice(-3);
      });
    }

    setLastMousePos({ x: mouseX, y: mouseY });
  }, [gameStarted, gameOver, isSlashing, lastMousePos, checkSlice, getMousePosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted || gameOver) return;
    setIsSlashing(true);
    
    const { x: mouseX, y: mouseY } = getMousePosition(e);
    setSlashTrails([{ points: [{ x: mouseX, y: mouseY }], timestamp: Date.now() }]);
  }, [gameStarted, gameOver, getMousePosition]);

  const handleMouseUp = useCallback(() => {
    setIsSlashing(false);
    setTimeout(() => setSlashTrails([]), 200);
  }, []);

  // Touch events for mobile
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!gameStarted || gameOver) return;

    const canvas = e.currentTarget;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    
    const touch = e.touches[0];
    const mouseX = (touch.clientX - rect.left) * scaleX;
    const mouseY = (touch.clientY - rect.top) * scaleY;

    if (isSlashing) {
      checkSlice(mouseX, mouseY, lastMousePos.x, lastMousePos.y);
      
      setSlashTrails(prev => {
        const newTrail = { points: [{ x: mouseX, y: mouseY }], timestamp: Date.now() };
        const updatedTrails = prev.map(trail => ({
          ...trail,
          points: [...trail.points, { x: mouseX, y: mouseY }].slice(-8)
        }));
        return [...updatedTrails, newTrail].slice(-3);
      });
    }

    setLastMousePos({ x: mouseX, y: mouseY });
  }, [gameStarted, gameOver, isSlashing, lastMousePos, checkSlice, canvasSize]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!gameStarted || gameOver) return;
    setIsSlashing(true);
    
    const canvas = e.currentTarget;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    
    const touch = e.touches[0];
    const mouseX = (touch.clientX - rect.left) * scaleX;
    const mouseY = (touch.clientY - rect.top) * scaleY;
    
    setSlashTrails([{ points: [{ x: mouseX, y: mouseY }], timestamp: Date.now() }]);
  }, [gameStarted, gameOver, canvasSize]);

  // Delegate session when game starts with toast notifications
  const startGame = useCallback(async () => {
    if (!publicKey || !signTransaction || !sendTransaction) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessingBlockchain(true);
    setSessionError(null);

    const toastId = addToast('Starting game session...', 'processing');

    try {
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) throw new Error('Failed to get program provider');

      // Check if session is already delegated using the service function
      const isDelegated = await checkSessionDelegated(program, publicKey);
      
      if (!isDelegated) {
        console.log('Delegating session...');
        const signature = await delegateSession(program, publicKey);
        setIsSessionDelegated(true);
        console.log('✅ Session delegated successfully');
        updateToast(toastId, 'Game session started!', 'success', signature);
      } else {
        console.log('Session already delegated, starting game...');
        setIsSessionDelegated(true);
        updateToast(toastId, 'Game session resumed!', 'success');
      }

      // Start the game
      setGameStarted(true);
      setGameOver(false);
      
      // If session wasn't previously delegated, reset game state
      if (!isDelegated) {
        setScore(0);
        setLives(5);
      }
      
      setFruits([]);
      setPowerups([]);
      setParticles([]);
      setSlashTrails([]);
      setActivePowerups([]);
      setMultiplier(1);
    } catch (error) {
      console.error('Error starting game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSessionError(`Failed to start game: ${errorMessage}`);
      updateToast(toastId, `Failed to start game: ${errorMessage}`, 'error');
    } finally {
      setIsProcessingBlockchain(false);
    }
  }, [publicKey, signTransaction, sendTransaction, addToast, updateToast]);

  // End game function
  const endGame = useCallback(async () => {
    setShowScoreScreen(true);
  }, []);

  // Simplified function to handle ending game and going home with toast notifications
  const handleEndAndGoHome = useCallback(async () => {
    if (!publicKey || !signTransaction || !sendTransaction) {
      router.push('/');
      return;
    }

    setIsProcessingBlockchain(true);
    const toastId = addToast('Ending game session...', 'processing');

    try {
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) throw new Error('Failed to get program provider');

      console.log('Ending session and undelegating...');
      const signature = await blockchainEndSession(program, publicKey);
      console.log('✅ Session ended and undelegated successfully');
      
      updateToast(toastId, 'Game session ended successfully!', 'success', signature);
      
      // Save score to localStorage
      saveScore(score);
      
      // Delay redirect to show toast
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error ending session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSessionError(`Failed to end session: ${errorMessage}`);
      updateToast(toastId, `Failed to end session: ${errorMessage}`, 'error');
      // Still redirect even if ending fails
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } finally {
      setIsProcessingBlockchain(false);
    }
  }, [publicKey, signTransaction, sendTransaction, router, score, addToast, updateToast]);

  const saveScore = useCallback((finalScore: number) => {
    try {
      const scoreEntry = {
        id: Date.now(),
        score: finalScore,
        date: new Date().toISOString().split('T')[0],
        rank: getRankFromScore(finalScore)
      };
      
      const existingScores = JSON.parse(localStorage.getItem('fruitNinjaScores') || '[]');
      const updatedScores = [scoreEntry, ...existingScores].slice(0, 10);
      
      localStorage.setItem('fruitNinjaScores', JSON.stringify(updatedScores));
      localStorage.setItem('fruitNinjaBestScore', finalScore.toString());
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }, []);

  const getRankFromScore = (score: number) => {
    if (score >= 1000) return "🏆 NINJA MASTER";
    if (score >= 500) return "⚔️ FRUIT WARRIOR";
    if (score >= 300) return "🎯 SHARP SHOOTER";
    if (score >= 200) return "👍 GETTING BETTER";
    if (score >= 100) return "💪 KEEP PRACTICING";
    return "🎯 TRY AGAIN";
  };

  // Update best score when game ends
  useEffect(() => {
    if (gameOver && score > bestScore) {
      setBestScore(score);
    }
  }, [gameOver, score, bestScore]);

  // Updated game over effect - just save score and trigger endGame
  useEffect(() => {
    if (gameOver && score > 0) {
      saveScore(score);
      if (score > bestScore) {
        setBestScore(score);
      }
      endGame();
    }
  }, [gameOver, score, bestScore, saveScore, endGame]);

  // Modified game loop with reduced spawn rates
  const gameLoop = useCallback(() => {
    if (!gameStarted || gameOver) return;

    const now = Date.now();
    const timeMultiplier = getTimeMultiplier();

    // Update active powerups
    setActivePowerups(prev => prev.filter(p => p.endTime > now));

    // Update fruits
    setFruits(prev => {
      const updated = prev.map(fruit => {
        if (fruit.sliced && fruit.sliceTime && now - fruit.sliceTime > 1000) {
          return null;
        }

        const newY = fruit.y + fruit.vy * timeMultiplier;
        const newVy = fruit.vy + GRAVITY * timeMultiplier;
        const newX = fruit.x + fruit.vx * timeMultiplier;
        const newRotation = fruit.rotation + fruit.rotationSpeed * timeMultiplier;

        let boundedX = newX;
        let boundedVx = fruit.vx;
        
        if (newX < fruit.size / 2) {
          boundedX = fruit.size / 2;
          boundedVx = Math.abs(fruit.vx) * 0.8;
        }
        else if (newX > canvasSize.width - fruit.size / 2) {
          boundedX = canvasSize.width - fruit.size / 2;
          boundedVx = -Math.abs(fruit.vx) * 0.8;
        }

        if (newY > canvasSize.height + 100) {
          if (!fruit.sliced) {
            setLives(l => l - 1);
            // Call blockchain lose life
            handleLoseLifeBlockchain();
          }
          return null;
        }

        return {
          ...fruit,
          x: boundedX,
          y: newY,
          vx: boundedVx,
          vy: newVy,
          rotation: newRotation,
        };
      }).filter(Boolean) as Fruit[];

      return updated;
    });

    // Update powerups
    setPowerups(prev => {
      const updated = prev.map(powerup => {
        if (powerup.sliced && powerup.sliceTime && now - powerup.sliceTime > 1000) {
          return null;
        }

        const newY = powerup.y + powerup.vy * timeMultiplier;
        const newVy = powerup.vy + GRAVITY * timeMultiplier;
        const newX = powerup.x + powerup.vx * timeMultiplier;
        const newRotation = powerup.rotation + powerup.rotationSpeed * timeMultiplier;

        let boundedX = newX;
        let boundedVx = powerup.vx;
        
        if (newX < powerup.size / 2) {
          boundedX = powerup.size / 2;
          boundedVx = Math.abs(powerup.vx) * 0.8;
        }
        else if (newX > canvasSize.width - powerup.size / 2) {
          boundedX = canvasSize.width - powerup.size / 2;
          boundedVx = -Math.abs(powerup.vx) * 0.8;
        }

        if (newY > canvasSize.height + 100) {
          return null;
        }

        return {
          ...powerup,
          x: boundedX,
          y: newY,
          vx: boundedVx,
          vy: newVy,
          rotation: newRotation,
        };
      }).filter(Boolean) as Powerup[];

      return updated;
    });

    // Update particles
    setParticles(prev => 
      prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx * timeMultiplier,
        y: particle.y + particle.vy * timeMultiplier,
        vy: particle.vy + GRAVITY * 0.3 * timeMultiplier,
        life: particle.life - 1,
      })).filter(p => p.life > 0)
    );

    setSlashTrails(prev => 
      prev.filter(trail => now - trail.timestamp < 300)
    );

    // Reduced spawn rates
    if (Math.random() < 0.015) { // Reduced from 0.025 to 0.015
      spawnFruit();
    }

    if (Math.random() < 0.002) { // Reduced from 0.004 to 0.002
      spawnPowerup();
    }
  }, [gameStarted, gameOver, spawnFruit, spawnPowerup, getTimeMultiplier, canvasSize, handleLoseLifeBlockchain]);

  // Game loop
  useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
    }
  }, [lives]);

  useEffect(() => {
    const loop = () => {
      gameLoop();
      animationRef.current = requestAnimationFrame(loop);
    };

    if (gameStarted && !gameOver) {
      animationRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameOver, gameLoop]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="60" height="60" viewBox="0 0 60 60" className="absolute inset-0 w-full h-full">
          <pattern id="pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="1" fill="currentColor"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#pattern)"/>
        </svg>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-center min-h-screen relative z-10 p-4">
        <div ref={containerRef} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 w-full max-w-6xl border border-white/50">
          
          <GameHeader 
            score={score} 
            lives={lives} 
            multiplier={multiplier} 
            bestScore={bestScore} 
          />
          
          <PowerupsDisplay activePowerups={activePowerups} />

          {/* Clean Session Status */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                isSessionDelegated 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isSessionDelegated ? 'bg-emerald-500' : 'bg-amber-500'
                }`}></div>
                {isSessionDelegated ? 'Session Active' : 'Session Inactive'}
              </div>
              
              {isProcessingBlockchain && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  Processing...
                </div>
              )}
            </div>

            {gameStarted && isSessionDelegated && !showScoreScreen && (
              <button
                onClick={endGame}
                disabled={isProcessingBlockchain}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessingBlockchain ? 'Ending...' : 'End Game'}
              </button>
            )}
          </div>

          {/* Clean Error Display */}
          {sessionError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-red-600">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1">{sessionError}</p>
                </div>
                <button 
                  onClick={() => setSessionError(null)}
                  className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <span className="sr-only">Dismiss</span>
                  <span className="text-xs text-red-600">✕</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <GameCanvas
              canvasSize={canvasSize}
              fruits={fruits}
              powerups={powerups}
              particles={particles}
              slashTrails={slashTrails}
              activePowerups={activePowerups}
              gameStarted={gameStarted}
              gameOver={gameOver}
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            />

            {!gameStarted && !showScoreScreen && (
              <GameStartOverlay 
                onStartGame={startGame} 
                isProcessing={isProcessingBlockchain}
              />
            )}

            {gameOver && !showScoreScreen && (
              <GameOverOverlay 
                score={score} 
                onPlayAgain={startGame}
                isProcessing={isProcessingBlockchain}
              />
            )}

            {showScoreScreen && (
              <ScoreScreen
                score={score}
                onEndAndGoHome={handleEndAndGoHome}
                isProcessing={isProcessingBlockchain}
              />
            )}
          </div>

          <GameTips />
        </div>
      </div>
    </div>
  );
}
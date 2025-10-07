'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import GameCanvas from '../../components/GameCanvas';
import GameHeader from '../../components/GameHeader';
import PowerupsDisplay from '../../components/PowerupsDisplay';
import GameStartOverlay from '../../components/GameStartOverlay';
import GameOverOverlay from '../../components/GameOverOverlay';
import BackgroundElements from '../../components/BackgroundElements';
import GameTips from '../../components/GameTips';
import { Point,Fruit,Powerup,ActivePowerup,Particle,SlashTrail,FRUIT_TYPES,POWERUP_TYPES,GRAVITY } from '@/types/game';
import { delegateSession, undelegateSession, sliceFruit as blockchainSliceFruit, loseLife as blockchainLoseLife, endSession as blockchainEndSession, getProvider, fetchGameSession } from '@/services';
import { PublicKey } from '@solana/web3.js';

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

  // Check wallet connection and redirect if not connected
  useEffect(() => {
    if (!publicKey) {
      router.push('/');
      return;
    }
  }, [publicKey, router]);

  // Fetch initial session state
  useEffect(() => {
    const fetchSessionState = async () => {
      if (!publicKey || !signTransaction || !sendTransaction) return;

      try {
        const program = getProvider(publicKey, signTransaction, sendTransaction);
        if (!program) return;

        const session = await fetchGameSession(program, publicKey);
        if (session && session.isActive) {
          setScore(session.currentScore?.toNumber() || 0);
          setLives(session.lives || 5);
          console.log('Loaded existing session:', session);
        }
      } catch (error) {
        console.error('Error fetching session state:', error);
      }
    };

    fetchSessionState();
  }, [publicKey, signTransaction, sendTransaction]);

  // Check if session is already delegated on component mount
  useEffect(() => {
    const checkDelegationStatus = async () => {
      if (!publicKey || !signTransaction || !sendTransaction) return;

      try {
        const program = getProvider(publicKey, signTransaction, sendTransaction);
        if (!program) return;

        const session = await fetchGameSession(program, publicKey);
        if (session && session.isActive) {
          // Check if session is delegated by trying to fetch delegation-related accounts
          // This is a simplified check - you might need to implement a proper delegation status check
          setIsSessionDelegated(true);
          setScore(session.currentScore?.toNumber() || 0);
          setLives(session.lives || 5);
          console.log('Found existing delegated session:', session);
        }
      } catch (error) {
        console.error('Error checking delegation status:', error);
      }
    };

    checkDelegationStatus();
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

  const spawnFruit = useCallback(() => {
    const fruitType = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    const size = Math.random() * 15 + 35;
    
    const margin = size / 2 + 20;
    const x = Math.random() * (canvasSize.width - 2 * margin) + margin;
    const y = canvasSize.height + 50;
    
    const maxHorizontalSpeed = 2;
    const vx = (Math.random() - 0.5) * maxHorizontalSpeed;
    const vy = -Math.random() * 8 - 10;
    
    const newFruit: Fruit = {
      id: Date.now() + Math.random(),
      x,
      y,
      vx,
      vy,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
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
    
    const vx = (Math.random() - 0.5) * 1.5;
    const vy = -Math.random() * 6 - 8;
    
    const newPowerup: Powerup = {
      id: Date.now() + Math.random(),
      x,
      y,
      vx,
      vy,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
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

  // Blockchain function to slice fruit
  const handleSliceFruitBlockchain = useCallback(async (points: number) => {
    if (!publicKey || !signTransaction || !sendTransaction || !isSessionDelegated) return;

    try {
      setIsProcessingBlockchain(true);
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) throw new Error('Failed to get program provider');

      await blockchainSliceFruit(program, publicKey, points);
      console.log(`✅ Sliced fruit on blockchain with ${points} points`);
    } catch (error) {
      console.error('Error slicing fruit on blockchain:', error);
      setSessionError(`Failed to record slice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingBlockchain(false);
    }
  }, [publicKey, signTransaction, sendTransaction, isSessionDelegated]);

  // Blockchain function to lose life
  const handleLoseLifeBlockchain = useCallback(async () => {
    if (!publicKey || !signTransaction || !sendTransaction || !isSessionDelegated) return;

    try {
      setIsProcessingBlockchain(true);
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) throw new Error('Failed to get program provider');

      await blockchainLoseLife(program, publicKey);
      console.log('✅ Lost life on blockchain');
    } catch (error) {
      console.error('Error losing life on blockchain:', error);
      setSessionError(`Failed to record life loss: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingBlockchain(false);
    }
  }, [publicKey, signTransaction, sendTransaction, isSessionDelegated]);

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

  // Delegate session when game starts
  const startGame = useCallback(async () => {
    if (!publicKey || !signTransaction || !sendTransaction) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessingBlockchain(true);
    setSessionError(null);

    try {
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) throw new Error('Failed to get program provider');

      // Check if session is already delegated
      if (!isSessionDelegated) {
        console.log('Delegating session...');
        await delegateSession(program, publicKey);
        setIsSessionDelegated(true);
        console.log('✅ Session delegated successfully');
      } else {
        console.log('Session already delegated, starting game...');
      }

      // Start the game
      setGameStarted(true);
      setGameOver(false);
      
      // If session is already delegated, preserve existing score and lives
      if (!isSessionDelegated) {
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
      setSessionError(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingBlockchain(false);
    }
  }, [publicKey, signTransaction, sendTransaction, isSessionDelegated]);

  // End game and undelegate session
  const endGame = useCallback(async () => {
    if (!publicKey || !signTransaction || !sendTransaction || !isSessionDelegated) return;

    setIsProcessingBlockchain(true);
    try {
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) throw new Error('Failed to get program provider');

      console.log('Undelegating session and ending game...');
      
      // First undelegate the session
      // Note: You'll need to provide the actual magicContext and magicProgram PublicKeys
      // For now, using placeholder - replace with actual values
      const magicContext = publicKey; // Replace with actual magic context
      const magicProgram = publicKey;  // Replace with actual magic program
      
      await undelegateSession(program, publicKey, magicContext, magicProgram);
      
      // Then end the session
      await blockchainEndSession(program, publicKey);
      
      setIsSessionDelegated(false);
      console.log('✅ Session undelegated and ended successfully');
      
      // Redirect back to home
      router.push('/');
    } catch (error) {
      console.error('Error ending game:', error);
      setSessionError(`Failed to end game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingBlockchain(false);
    }
  }, [publicKey, signTransaction, sendTransaction, isSessionDelegated, router]);

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

  // Update your game over effect to save the score
  useEffect(() => {
    if (gameOver && score > 0) {
      saveScore(score);
      if (score > bestScore) {
        setBestScore(score);
      }
      // Auto end game after saving score
      endGame();
    }
  }, [gameOver, score, bestScore, saveScore, endGame]);

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

    // Spawn fruits and powerups
    if (Math.random() < 0.025) {
      spawnFruit();
    }

    if (Math.random() < 0.004) {
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

  // Helper function to check if session is actually delegated
  const checkSessionDelegated = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !signTransaction || !sendTransaction) return false;

    try {
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) return false;

      // Derive delegation-related PDAs to check if they exist
      const [sessionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("session"), publicKey.toBuffer()],
        program.programId
      );

      const [bufferSessionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("buffer"), sessionPda.toBuffer()],
        new PublicKey("BLCzHNMKKgDiawL1iNXozxstgrXLSNBrCvnrBewnDvdf") // BUFFER_PROGRAM
      );

      // Try to fetch the buffer account to see if delegation exists
      const bufferAccount = await program.provider.connection.getAccountInfo(bufferSessionPda);
      return bufferAccount !== null;
    } catch (error) {
      console.error('Error checking delegation status:', error);
      return false;
    }
  }, [publicKey, signTransaction, sendTransaction]);

  // Update the initial check
  useEffect(() => {
    const checkDelegationStatus = async () => {
      if (!publicKey || !signTransaction || !sendTransaction) return;

      try {
        const program = getProvider(publicKey, signTransaction, sendTransaction);
        if (!program) return;

        const session = await fetchGameSession(program, publicKey);
        if (session && session.isActive) {
          // Check if session is actually delegated
          const isDelegated = await checkSessionDelegated();
          setIsSessionDelegated(isDelegated);
          setScore(session.currentScore?.toNumber() || 0);
          setLives(session.lives || 5);
          console.log('Session status - Active:', session.isActive, 'Delegated:', isDelegated);
        }
      } catch (error) {
        console.error('Error checking session status:', error);
      }
    };

    checkDelegationStatus();
  }, [publicKey, signTransaction, sendTransaction, checkSessionDelegated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4">
      <BackgroundElements />

      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div ref={containerRef} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 w-full max-w-6xl border border-gray-300">
          
          <GameHeader 
            score={score} 
            lives={lives} 
            multiplier={multiplier} 
            bestScore={bestScore} 
          />
          
          <PowerupsDisplay activePowerups={activePowerups} />

          {/* Session Status Display */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSessionDelegated ? (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  🟢 Session Active
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  🟡 Session Inactive
                </span>
              )}
              
              {isProcessingBlockchain && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  🔄 Processing...
                </span>
              )}
            </div>

            {gameStarted && isSessionDelegated && (
              <button
                onClick={endGame}
                disabled={isProcessingBlockchain}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isProcessingBlockchain ? 'Ending...' : 'End Game'}
              </button>
            )}
          </div>

          {/* Error Display */}
          {sessionError && (
            <div className="mb-4 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg">
              {sessionError}
              <button 
                onClick={() => setSessionError(null)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                ✕
              </button>
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

            {!gameStarted && (
              <GameStartOverlay 
                onStartGame={startGame} 
                isProcessing={isProcessingBlockchain}
              />
            )}

            {gameOver && (
              <GameOverOverlay 
                score={score} 
                onPlayAgain={startGame}
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
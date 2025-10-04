'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import GameCanvas from '../../components/GameCanvas';
import GameHeader from '../../components/GameHeader';
import PowerupsDisplay from '../../components/PowerupsDisplay';
import GameStartOverlay from '../../components/GameStartOverlay';
import GameOverOverlay from '../../components/GameOverOverlay';
import BackgroundElements from '../../components/BackgroundElements';
import GameTips from '../../components/GameTips';
import { Point,Fruit,Powerup,ActivePowerup,Particle,SlashTrail,FRUIT_TYPES,POWERUP_TYPES,GRAVITY } from '@/types/game';



export default function FruitNinja() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 }); // Increased size
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

  // Responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 48;
        const maxWidth = Math.min(containerWidth, 1000); // Increased max width
        const aspectRatio = 10 / 7; // Adjusted aspect ratio for larger canvas
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
    
    // Spawn well within canvas bounds considering fruit size
    const margin = size / 2 + 20; // Extra margin for safety
    const x = Math.random() * (canvasSize.width - 2 * margin) + margin;
    const y = canvasSize.height + 50;
    
    // Very limited horizontal velocity to prevent boundary issues
    const maxHorizontalSpeed = 2; // Much smaller horizontal speed
    const vx = (Math.random() - 0.5) * maxHorizontalSpeed;
    
    // Good vertical velocity for nice arcs
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
    
    // Spawn well within canvas bounds
    const margin = size / 2 + 15;
    const x = Math.random() * (canvasSize.width - 2 * margin) + margin;
    const y = canvasSize.height + 50;
    
    // Minimal horizontal velocity
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

  const activatePowerup = useCallback((type: string) => {
    const now = Date.now();
    let duration = 5000; // 5 seconds default

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
            setScore(s => s + 10 * multiplier);
            return { ...fruit, sliced: true, sliceTime: now };
          }
          return fruit;
        }));
        return; // Bomb doesn't need duration
      case 'freeze':
        duration = 6000;
        break;
    }

    setActivePowerups(prev => {
      const filtered = prev.filter(p => p.type !== type);
      return [...filtered, { type, endTime: now + duration }];
    });
  }, [multiplier]);

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

  const checkSlice = useCallback((mouseX: number, mouseY: number, prevX: number, prevY: number) => {
    const doubleActive = activePowerups.find(p => p.type === 'double');
    const currentMultiplier = doubleActive ? 2 : 1;
    setMultiplier(currentMultiplier);

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
          setScore(s => s + 10 * currentMultiplier);
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
  }, [activePowerups, createParticles, activatePowerup]);

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

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(5);
    setFruits([]);
    setPowerups([]);
    setParticles([]);
    setSlashTrails([]);
    setActivePowerups([]);
    setMultiplier(1);
  }, []);

  // Update best score when game ends
  useEffect(() => {
    if (gameOver && score > bestScore) {
      setBestScore(score);
    }
  }, [gameOver, score, bestScore]);

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

        // Strict boundary enforcement - keep fruits within canvas
        let boundedX = newX;
        let boundedVx = fruit.vx;
        
        // Left boundary check
        if (newX < fruit.size / 2) {
          boundedX = fruit.size / 2;
          boundedVx = Math.abs(fruit.vx) * 0.8; // Bounce right
        }
        // Right boundary check  
        else if (newX > canvasSize.width - fruit.size / 2) {
          boundedX = canvasSize.width - fruit.size / 2;
          boundedVx = -Math.abs(fruit.vx) * 0.8; // Bounce left
        }

        if (newY > canvasSize.height + 100) {
          if (!fruit.sliced) {
            setLives(l => l - 1);
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

        // Strict boundary enforcement for powerups
        let boundedX = newX;
        let boundedVx = powerup.vx;
        
        // Left boundary check
        if (newX < powerup.size / 2) {
          boundedX = powerup.size / 2;
          boundedVx = Math.abs(powerup.vx) * 0.8; // Bounce right
        }
        // Right boundary check
        else if (newX > canvasSize.width - powerup.size / 2) {
          boundedX = canvasSize.width - powerup.size / 2;
          boundedVx = -Math.abs(powerup.vx) * 0.8; // Bounce left
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
    if (Math.random() < 0.025) { // Increased spawn rate for more coverage
      spawnFruit();
    }

    if (Math.random() < 0.004) { // Slightly increased powerup spawn rate
      spawnPowerup();
    }
  }, [gameStarted, gameOver, spawnFruit, spawnPowerup, getTimeMultiplier, canvasSize]);

  const draw = useCallback(() => {
    // Drawing logic is now handled in GameCanvas component
  }, []);

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
              <GameStartOverlay onStartGame={startGame} />
            )}

            {gameOver && (
              <GameOverOverlay score={score} onPlayAgain={startGame} />
            )}
          </div>

          <GameTips />
        </div>
      </div>
    </div>
  );
}
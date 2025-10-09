'use client'
import { useRef, useEffect, useCallback } from 'react';
import type {  
  GameCanvasProps 
} from '../types/game';

export default function GameCanvas({
  canvasSize,
  fruits,
  powerups,
  particles,
  slashTrails,
  activePowerups,
  gameStarted,
  gameOver,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Add powerup background effects
    const slowActive = activePowerups.find(p => p.type === 'slow');
    const freezeActive = activePowerups.find(p => p.type === 'freeze');
    const doubleActive = activePowerups.find(p => p.type === 'double');

    if (freezeActive) {
      ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    } else if (slowActive) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }

    if (doubleActive) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, canvasSize.width - 8, canvasSize.height - 8);
    }

    // Draw slash trails
    slashTrails.forEach(trail => {
      if (trail.points.length > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = Math.max(4, canvasSize.width * 0.01);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.moveTo(trail.points[0].x, trail.points[0].y);
        for (let i = 1; i < trail.points.length; i++) {
          ctx.lineTo(trail.points[i].x, trail.points[i].y);
        }
        ctx.stroke();
        
        ctx.shadowBlur = 0;
      }
    });

    // Draw fruits
    fruits.forEach(fruit => {
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.rotate(fruit.rotation);
      
      if (fruit.sliced && fruit.sliceTime) {
        const timeSinceSlice = Date.now() - fruit.sliceTime;
        const opacity = Math.max(0, 1 - timeSinceSlice / 1000);
        ctx.globalAlpha = opacity;
        
        ctx.font = `${fruit.size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Left piece
        ctx.save();
        ctx.translate(-fruit.size * 0.3, -fruit.size * 0.1);
        ctx.rotate(-0.2);
        ctx.fillText(fruit.emoji, 0, 0);
        ctx.restore();
        
        // Right piece
        ctx.save();
        ctx.translate(fruit.size * 0.3, fruit.size * 0.1);
        ctx.rotate(0.2);
        ctx.fillText(fruit.emoji, 0, 0);
        ctx.restore();
      } else {
        ctx.font = `${fruit.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fruit.emoji, 0, 0);
      }
      
      ctx.restore();
    });

    // Draw powerups with glow effect
    powerups.forEach(powerup => {
      ctx.save();
      ctx.translate(powerup.x, powerup.y);
      ctx.rotate(powerup.rotation);
      
      if (powerup.sliced && powerup.sliceTime) {
        const timeSinceSlice = Date.now() - powerup.sliceTime;
        const opacity = Math.max(0, 1 - timeSinceSlice / 1000);
        ctx.globalAlpha = opacity;
      }

      // Glow effect
      ctx.shadowColor = powerup.color;
      ctx.shadowBlur = 15;
      ctx.font = `${powerup.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(powerup.emoji, 0, 0);
      
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      const size = Math.max(2, canvasSize.width * 0.005);
      ctx.fillRect(particle.x - size/2, particle.y - size/2, size, size);
    });

  }, [fruits, powerups, particles, slashTrails, activePowerups, canvasSize]);

  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animationLoop = () => {
      draw();
      if (gameStarted && !gameOver) {
        animationFrameRef.current = requestAnimationFrame(animationLoop);
      }
    };
    
    if (gameStarted && !gameOver) {
      animationLoop();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw, gameStarted, gameOver]);

  return (
    <div className="relative">
      <div className="absolute -inset-2 bg-gray-200 rounded-2xl opacity-50 blur-sm"></div>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative border-3 border-gray-400 rounded-2xl cursor-crosshair bg-gradient-to-b from-sky-100 to-blue-50 w-full h-auto shadow-2xl"
        style={{ display: 'block', touchAction: 'none' }}
      />
    </div>
  );
}

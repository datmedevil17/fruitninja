import React from 'react';

interface GameHeaderProps {
  score: number;
  lives: number;
  multiplier: number;
  bestScore: number;
}

export default function GameHeader({ score, lives, multiplier, bestScore }: GameHeaderProps) {
  return (
    <div className="text-center mb-6">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="text-4xl animate-pulse">🥷</div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-800">
          Fruit Ninja
        </h1>
        <div className="text-4xl animate-pulse">🗡️</div>
      </div>
      
      {/* Minimalist Stats Bar */}
      <div className="flex justify-between items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</div>
            <div className="text-2xl font-black text-gray-800">{score.toLocaleString()}</div>
            {multiplier > 1 && (
              <div className="text-xs font-bold text-orange-600 animate-pulse">×{multiplier} Bonus</div>
            )}
          </div>
          
          <div className="h-12 w-px bg-gray-300"></div>
          
          <div className="text-center">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lives</div>
            <div className="text-lg">{'❤️'.repeat(Math.max(0, Math.min(lives, 5)))}{'🤍'.repeat(Math.max(0, 5 - lives))}</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Best</div>
          <div className="text-lg font-bold text-gray-800">{bestScore.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

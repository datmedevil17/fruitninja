import React from 'react';

interface GameOverOverlayProps {
  score: number;
  onPlayAgain: () => void;
}

export default function GameOverOverlay({ score, onPlayAgain }: GameOverOverlayProps) {
  const getRankMessage = (score: number) => {
    if (score >= 500) return "🏆 NINJA MASTER!";
    if (score >= 300) return "⚔️ FRUIT WARRIOR!";
    if (score >= 200) return "🎯 SHARP SHOOTER!";
    if (score >= 100) return "👍 GETTING BETTER!";
    if (score >= 50) return "💪 KEEP PRACTICING!";
    return "🎯 TRY AGAIN!";
  };

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
      <div className="text-center p-6 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-300 max-w-md mx-4">
        <div className="text-5xl mb-4">💥</div>
        <h2 className="text-3xl font-black text-gray-800 mb-4">
          Game Over!
        </h2>
        
        <div className="bg-gray-100 rounded-2xl p-4 mb-4 border border-gray-200">
          <div className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wider">Final Score</div>
          <div className="text-4xl font-black text-gray-800">{score.toLocaleString()}</div>
        </div>
        
        <div className="text-2xl mb-6 text-gray-700">
          {getRankMessage(score)}
        </div>
        
        <button
          onClick={onPlayAgain}
          className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}

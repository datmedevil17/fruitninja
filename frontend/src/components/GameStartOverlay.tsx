import React from 'react';

interface GameStartOverlayProps {
  onStartGame: () => void;
}

export default function GameStartOverlay({ onStartGame }: GameStartOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
      <div className="text-center p-6 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-300 max-w-md mx-4">
        <div className="text-5xl mb-4 animate-bounce">⚔️</div>
        <h2 className="text-3xl font-black text-gray-800 mb-4">
          Ready to Slice?
        </h2>
        <div className="text-gray-600 mb-6 space-y-3">
          <p className="font-medium">🎯 Slice fruits by dragging across them!</p>
          <p className="font-medium">❤️ Don&apos;t let fruits fall off the screen!</p>
          
          <div className="bg-gray-50 rounded-2xl p-4 mt-4 border border-gray-200">
            <div className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Powerups</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span>⏰</span>
                <span className="font-medium text-gray-700">Slow Motion</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💎</span>
                <span className="font-medium text-gray-700">Double Points</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💣</span>
                <span className="font-medium text-gray-700">Bomb All</span>
              </div>
              <div className="flex items-center gap-2">
                <span>❄️</span>
                <span className="font-medium text-gray-700">Freeze Time</span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={onStartGame}
          className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
        >
          🚀 Start Slicing!
        </button>
      </div>
    </div>
  );
}

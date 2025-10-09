interface GameStartOverlayProps {
  onStartGame: () => void;
  isProcessing: boolean;
}

export default function GameStartOverlay({ onStartGame, isProcessing = false }: GameStartOverlayProps) {
  return (
    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center rounded-2xl">
      <div className="text-center p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 max-w-md mx-4">
        <div className="mb-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚔️</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to Play?</h2>
          <p className="text-slate-600">Slice fruits and collect powerups to earn points!</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">How to Play</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span>Drag to slice fruits</span>
              </div>
              <div className="flex items-center gap-2">
                <span>❤️</span>
                <span>Don&apos;t let fruits fall</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span>Collect powerups for bonuses</span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={onStartGame}
          disabled={isProcessing}
          className="w-full bg-slate-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Starting...
            </span>
          ) : (
            'Start Game'
          )}
        </button>
      </div>
    </div>
  );
}
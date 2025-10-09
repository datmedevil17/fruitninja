interface GameHeaderProps {
  score: number;
  lives: number;
  multiplier: number;
  bestScore: number;
}

export default function GameHeader({ score, lives, multiplier, bestScore }: GameHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
          <span className="text-lg">🥷</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Fruit Ninja</h1>
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
          <span className="text-lg">🗡️</span>
        </div>
      </div>
      
      {/* Professional Stats */}
      <div className="grid grid-cols-3 gap-6 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
        <div className="text-center">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Score</div>
          <div className="text-2xl font-bold text-slate-900">{score.toLocaleString()}</div>
          {multiplier > 1 && (
            <div className="text-xs font-medium text-orange-600 mt-1">×{multiplier} Multiplier</div>
          )}
        </div>
        
        <div className="text-center border-l border-r border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lives</div>
          <div className="flex justify-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <div 
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < lives ? 'bg-red-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Best</div>
          <div className="text-2xl font-bold text-slate-900">{bestScore.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
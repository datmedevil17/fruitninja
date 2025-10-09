interface GameOverOverlayProps {
  score: number;
  onPlayAgain: () => void;
  isProcessing?: boolean;
}

export default function GameOverOverlay({ score, onPlayAgain, isProcessing = false }: GameOverOverlayProps) {
  const getRankMessage = (score: number) => {
    if (score >= 500) return { title: "Excellent!", icon: "🏆" };
    if (score >= 300) return { title: "Great Job!", icon: "⭐" };
    if (score >= 200) return { title: "Well Done!", icon: "👏" };
    if (score >= 100) return { title: "Good Effort!", icon: "👍" };
    if (score >= 50) return { title: "Keep Trying!", icon: "💪" };
    return { title: "Try Again!", icon: "🎯" };
  };

  const rank = getRankMessage(score);

  return (
    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center rounded-2xl">
      <div className="text-center p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 max-w-md mx-4">
        <div className="mb-6">
          <div className="text-5xl mb-4">{rank.icon}</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{rank.title}</h2>
          <div className="text-4xl font-bold text-slate-900 mb-2">{score.toLocaleString()}</div>
          <p className="text-slate-600">Points earned this round</p>
        </div>
        
        <button
          onClick={onPlayAgain}
          disabled={isProcessing}
          className="w-full bg-slate-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Starting...
            </span>
          ) : (
            'Play Again'
          )}
        </button>
      </div>
    </div>
  );
}
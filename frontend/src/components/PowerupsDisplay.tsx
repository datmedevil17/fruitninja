interface ActivePowerup {
  type: string;
  endTime: number;
}

interface PowerupsDisplayProps {
  activePowerups: ActivePowerup[];
}

const POWERUP_TYPES = [
  { type: 'slow', emoji: '⏱️', color: '#6366f1', name: 'Slow Motion' },
  { type: 'double', emoji: '💎', color: '#f59e0b', name: 'Double Points' },
  { type: 'bomb', emoji: '💣', color: '#ef4444', name: 'Bomb' },
  { type: 'freeze', emoji: '❄️', color: '#06b6d4', name: 'Freeze' },
];

export default function PowerupsDisplay({ activePowerups }: PowerupsDisplayProps) {
  const formatTime = (ms: number) => Math.ceil(ms / 1000);

  if (activePowerups.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
        Active Powerups
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {activePowerups.map(powerup => {
          const powerupInfo = POWERUP_TYPES.find(p => p.type === powerup.type);
          const timeLeft = formatTime(powerup.endTime - Date.now());
          
          return (
            <div 
              key={powerup.type} 
              className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/50 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{powerupInfo?.emoji}</span>
                <span className="font-medium text-slate-700 text-sm">{powerupInfo?.name}</span>
              </div>
              <div className="bg-slate-900 text-white px-2 py-1 rounded-lg text-xs font-medium">
                {timeLeft}s
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
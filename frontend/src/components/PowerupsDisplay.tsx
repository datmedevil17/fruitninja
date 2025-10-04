import React from 'react';

interface ActivePowerup {
  type: string;
  endTime: number;
}

interface PowerupsDisplayProps {
  activePowerups: ActivePowerup[];
}

const POWERUP_TYPES = [
  { type: 'slow', emoji: '⏰', color: '#4444ff', name: 'Slow Motion' },
  { type: 'double', emoji: '💎', color: '#ffaa00', name: 'Double Points' },
  { type: 'bomb', emoji: '💣', color: '#ff0000', name: 'Bomb' },
  { type: 'freeze', emoji: '❄️', color: '#00aaff', name: 'Freeze' },
];

export default function PowerupsDisplay({ activePowerups }: PowerupsDisplayProps) {
  const formatTime = (ms: number) => Math.ceil(ms / 1000);

  if (activePowerups.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-md">
      <div className="text-xs font-bold text-gray-700 mb-3 text-center uppercase tracking-wider">Active Powerups</div>
      <div className="flex flex-wrap justify-center gap-3">
        {activePowerups.map(powerup => {
          const powerupInfo = POWERUP_TYPES.find(p => p.type === powerup.type);
          const timeLeft = formatTime(powerup.endTime - Date.now());
          return (
            <div key={powerup.type} className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-gray-300">
              <span className="mr-2 text-lg">{powerupInfo?.emoji}</span>
              <span className="font-semibold text-gray-800 text-sm">{powerupInfo?.name}</span>
              <span className="ml-2 bg-gray-800 text-white px-2 py-0.5 rounded-full text-xs font-bold">{timeLeft}s</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

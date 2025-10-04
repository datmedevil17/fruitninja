import React from 'react';

export default function GameTips() {
  return (
    <div className="mt-6 text-center">
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="text-gray-700">
          <span className="text-xl mr-2">💡</span>
          <span className="font-semibold text-sm">Pro Tip:</span>
          <span className="ml-2 text-sm">Slice fruits in quick combos and collect glowing powerups for massive points!</span>
        </div>
      </div>
    </div>
  );
}

'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ScoreEntry {
  id: number;
  score: number;
  date: string;
  rank: string;
}

export default function Scores() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [personalBest, setPersonalBest] = useState(0);

  // Load scores from localStorage on component mount
  useEffect(() => {
    const loadScores = () => {
      try {
        const savedScores = localStorage.getItem('fruitNinjaScores');
        const savedBest = localStorage.getItem('fruitNinjaBestScore');
        
        if (savedScores) {
          setScores(JSON.parse(savedScores));
        } else {
          // Demo scores if none exist
          const demoScores = [
            { id: 1, score: 1250, date: '2024-01-15', rank: '🏆 NINJA MASTER' },
            { id: 2, score: 890, date: '2024-01-14', rank: '⚔️ FRUIT WARRIOR' },
            { id: 3, score: 650, date: '2024-01-13', rank: '🎯 SHARP SHOOTER' },
            { id: 4, score: 420, date: '2024-01-12', rank: '⚔️ FRUIT WARRIOR' },
            { id: 5, score: 320, date: '2024-01-11', rank: '🎯 SHARP SHOOTER' },
          ];
          setScores(demoScores);
        }
        
        if (savedBest) {
          setPersonalBest(parseInt(savedBest));
        }
      } catch (error) {
        console.error('Error loading scores:', error);
      }
    };

    loadScores();
  }, []);

  const getRankFromScore = (score: number) => {
    if (score >= 1000) return "🏆 NINJA MASTER";
    if (score >= 500) return "⚔️ FRUIT WARRIOR";
    if (score >= 300) return "🎯 SHARP SHOOTER";
    if (score >= 200) return "👍 GETTING BETTER";
    if (score >= 100) return "💪 KEEP PRACTICING";
    return "🎯 TRY AGAIN";
  };

  const clearScores = () => {
    if (confirm('Are you sure you want to clear all scores?')) {
      localStorage.removeItem('fruitNinjaScores');
      localStorage.removeItem('fruitNinjaBestScore');
      setScores([]);
      setPersonalBest(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl opacity-10 animate-bounce">🏆</div>
        <div className="absolute top-40 right-20 text-5xl opacity-10 animate-pulse">⚔️</div>
        <div className="absolute bottom-32 left-20 text-7xl opacity-10 animate-spin">🥷</div>
        <div className="absolute bottom-20 right-10 text-6xl opacity-10 animate-bounce">🎯</div>
      </div>

      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-4xl border border-gray-300">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-4xl animate-pulse">📊</div>
              <h1 className="text-4xl sm:text-6xl font-black text-gray-800">
                High Scores
              </h1>
              <div className="text-4xl animate-pulse">🏆</div>
            </div>
            <p className="text-lg text-gray-600">Track your ninja progress</p>
          </div>

          {/* Personal Best */}
          {personalBest > 0 && (
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 mb-8 border-2 border-yellow-300">
              <div className="text-center">
                <div className="text-3xl mb-2">🏆</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Personal Best</h2>
                <div className="text-3xl font-black text-gray-800">{personalBest.toLocaleString()}</div>
                <div className="text-sm font-medium text-gray-600 mt-1">{getRankFromScore(personalBest)}</div>
              </div>
            </div>
          )}

          {/* Scores List */}
          <div className="space-y-4 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">Recent Games</h3>
            
            {scores.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-50">🎯</div>
                <p className="text-xl text-gray-500 mb-4">No scores yet!</p>
                <p className="text-gray-400">Play your first game to see your scores here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scores.map((entry, index) => (
                  <div key={entry.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-gray-500 min-w-[3rem]">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="text-xl font-bold text-gray-800">
                            {entry.score.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">{entry.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-600">
                          {entry.rank}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/game">
              <button className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 min-w-[180px]">
                🎮 Play Again
              </button>
            </Link>
            
            <Link href="/">
              <button className="bg-white/80 hover:bg-white text-gray-800 font-bold py-3 px-6 rounded-xl text-lg border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 min-w-[180px]">
                🏠 Home
              </button>
            </Link>
            
            {scores.length > 0 && (
              <button 
                onClick={clearScores}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 min-w-[180px]"
              >
                🗑️ Clear Scores
              </button>
            )}
          </div>

          {/* Score Ranks Info */}
          <div className="mt-8 bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">Score Ranks</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="font-medium">🏆 NINJA MASTER</div>
                <div className="text-gray-500">1000+ points</div>
              </div>
              <div className="text-center">
                <div className="font-medium">⚔️ FRUIT WARRIOR</div>
                <div className="text-gray-500">500+ points</div>
              </div>
              <div className="text-center">
                <div className="font-medium">🎯 SHARP SHOOTER</div>
                <div className="text-gray-500">300+ points</div>
              </div>
              <div className="text-center">
                <div className="font-medium">👍 GETTING BETTER</div>
                <div className="text-gray-500">200+ points</div>
              </div>
              <div className="text-center">
                <div className="font-medium">💪 KEEP PRACTICING</div>
                <div className="text-gray-500">100+ points</div>
              </div>
              <div className="text-center">
                <div className="font-medium">🎯 TRY AGAIN</div>
                <div className="text-gray-500">0-99 points</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
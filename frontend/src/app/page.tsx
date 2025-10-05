'use client'
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce">🍎</div>
        <div className="absolute top-40 right-20 text-5xl opacity-15 animate-pulse">🍊</div>
        <div className="absolute bottom-32 left-20 text-7xl opacity-10 animate-spin">🍌</div>
        <div className="absolute bottom-20 right-10 text-6xl opacity-20 animate-bounce">🍓</div>
        <div className="absolute top-1/2 left-1/4 text-4xl opacity-10 animate-pulse">🥝</div>
        <div className="absolute top-1/3 right-1/3 text-5xl opacity-15 animate-spin">🍇</div>
      </div>

      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          
          {/* Main Title */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-8xl animate-pulse">🥷</div>
              <h1 className="text-6xl sm:text-8xl font-black text-gray-800 drop-shadow-lg">
                Fruit Ninja
              </h1>
              <div className="text-8xl animate-pulse">🗡️</div>
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 font-medium">
              Slice your way to victory!
            </p>
          </div>

          {/* Game Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Slice Fruits</h3>
              <p className="text-gray-600">Swipe across fruits to slice them and earn points!</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Power-ups</h3>
              <p className="text-gray-600">Collect special power-ups for explosive combos!</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">High Scores</h3>
              <p className="text-gray-600">Compete for the highest score and become a ninja master!</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/game">
              <button className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 min-w-[200px]">
                🚀 Start Playing
              </button>
            </Link>
            
            <Link href="/scores">
              <button className="bg-white/80 hover:bg-white text-gray-800 font-bold py-4 px-8 rounded-2xl text-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 min-w-[200px]">
                📊 View Scores
              </button>
            </Link>
          </div>

          {/* How to Play */}
          <div className="mt-16 bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-3xl font-black text-gray-800 mb-6">How to Play</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👆</span>
                  <div>
                    <h4 className="font-bold text-gray-800">Slice Fruits</h4>
                    <p className="text-gray-600">Drag your finger or mouse across fruits to slice them</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-2xl">❤️</span>
                  <div>
                    <h4 className="font-bold text-gray-800">Don't Miss</h4>
                    <p className="text-gray-600">Lose a life when fruits fall off the screen</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h4 className="font-bold text-gray-800">Power-ups</h4>
                    <p className="text-gray-600">Slice special items for slow motion, double points, and more!</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <h4 className="font-bold text-gray-800">High Score</h4>
                    <p className="text-gray-600">Chain combos to maximize your score</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

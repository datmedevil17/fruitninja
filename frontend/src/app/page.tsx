'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { checkProfileExists, initializeProfile, getProvider, startGameSession, checkActiveSession, fetchGameSession } from '@/services';

// Profile Creation Modal Component
const ProfileModal = ({ isOpen, onClose, onCreateProfile }: {
  isOpen: boolean;
  onClose: () => void;
  onCreateProfile: (username: string) => void;
}) => {
  const [username, setUsername] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateProfile(username.trim());
      setUsername('');
      onClose();
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🥷</div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">Create Your Profile</h2>
          <p className="text-gray-600">Choose a username to start your fruit ninja journey!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your ninja name..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-gray-800 focus:outline-none text-lg"
              maxLength={32}
              required
              disabled={isCreating}
            />
            <p className="text-xs text-gray-500 mt-1">Max 32 characters</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!username.trim() || isCreating}
              className="flex-1 py-3 px-6 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? '🔄 Creating...' : '🚀 Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);

  // Check if user has a profile and active session when wallet connects
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!publicKey) {
        setHasProfile(false);
        setHasActiveSession(false);
        setCurrentSession(null);
        return;
      }

      setIsCheckingProfile(true);
      try {
        const program = getProvider(publicKey, signTransaction, sendTransaction);
        if (!program) {
          console.log('Failed to get program provider');
          setIsCheckingProfile(false);
          return;
        }

        // Step 1: Check if profile exists
        const profileExists = await checkProfileExists(program, publicKey);
        setHasProfile(profileExists);
        
        if (!profileExists) {
          setShowProfileModal(true);
          setHasActiveSession(false);
          setCurrentSession(null);
          return;
        }

        // Step 2: Check if there's an active session
        const activeSession = await checkActiveSession(program, publicKey);
        setHasActiveSession(activeSession);

        // Step 3: If active session exists, fetch session details
        if (activeSession) {
          const sessionData = await fetchGameSession(program, publicKey);
          setCurrentSession(sessionData);
          console.log('Active session found:', sessionData);
        } else {
          setCurrentSession(null);
        }

      } catch (error) {
        console.error('Error checking user status:', error);
        setHasProfile(false);
        setHasActiveSession(false);
        setCurrentSession(null);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkUserStatus();
  }, [publicKey, signTransaction, sendTransaction]);

  const handleCreateProfile = async (username: string) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    const program = getProvider(publicKey, signTransaction, sendTransaction);
    if (!program) {
      throw new Error('Failed to get program provider');
    }

    try {
      const signature = await initializeProfile(program, publicKey, username);
      console.log('Profile created successfully:', signature);
      setHasProfile(true);
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }
  };

  const handleStartGame = async () => {
    if (!publicKey || !signTransaction || !sendTransaction) {
      alert('Please connect your wallet first');
      return;
    }

    if (!hasProfile) {
      setShowProfileModal(true);
      return;
    }

    setIsStartingGame(true);
    try {
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) {
        throw new Error('Failed to get program provider');
      }

      // Step 1: Check if there's already an active session
      console.log('Checking for active session...');
      const activeSessionExists = await checkActiveSession(program, publicKey);
      
      if (activeSessionExists) {
        // If active session exists, just redirect to game
        console.log('Active session found, redirecting to game...');
        const sessionData = await fetchGameSession(program, publicKey);
        setCurrentSession(sessionData);
        setHasActiveSession(true);
        router.push('/game');
        return;
      }

      // Step 2: No active session, start a new one
      console.log('No active session found, starting new game session...');
      const signature = await startGameSession(program, publicKey);
      console.log('Game session started successfully:', signature);
      
      // Step 3: Fetch the new session data
      const newSessionData = await fetchGameSession(program, publicKey);
      setCurrentSession(newSessionData);
      setHasActiveSession(true);
      
      // Step 4: Redirect to game page
      router.push('/game');
    } catch (error) {
      console.error('Failed to start game session:', error);
      alert(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStartingGame(false);
    }
  };

  // Show loading state while checking profile
  if (publicKey && isCheckingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl animate-spin mb-4">🥷</div>
          <h2 className="text-2xl font-bold text-gray-800">Checking your profile...</h2>
        </div>
      </div>
    );
  }

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
            
            {/* Profile & Session Status */}
            {publicKey && (
              <div className="mt-4 space-y-2">
                {hasProfile ? (
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                    ✅ Profile Ready
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-medium">
                    ⚠️ Profile Required
                  </div>
                )}
                
                {hasProfile && hasActiveSession && currentSession && (
                  <div className="block">
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
                      🎮 Active Game Session - Score: {currentSession.currentScore?.toString() || '0'} | Lives: {currentSession.lives || 0}
                    </div>
                  </div>
                )}
              </div>
            )}
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
            {publicKey && hasProfile ? (
              <>
                <button 
                  onClick={handleStartGame}
                  disabled={isStartingGame}
                  className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isStartingGame ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {hasActiveSession ? 'Resuming...' : 'Starting...'}
                    </span>
                  ) : (
                    hasActiveSession ? '🎮 Resume Game' : '🚀 Start Playing'
                  )}
                </button>
                
                <Link href="/scores">
                  <button className="bg-white/80 hover:bg-white text-gray-800 font-bold py-4 px-8 rounded-2xl text-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 min-w-[200px]">
                    📊 View Scores
                  </button>
                </Link>
              </>
            ) : (
              <div className="text-center">
                {!publicKey ? (
                  <div className="bg-blue-100 text-blue-800 px-6 py-4 rounded-2xl font-medium">
                    🔗 Please connect your wallet to start playing
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 min-w-[200px]"
                  >
                    🆕 Create Profile
                  </button>
                )}
              </div>
            )}
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
                    <h4 className="font-bold text-gray-800">Don&apos;t Miss</h4>
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

      {/* Profile Creation Modal */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onCreateProfile={handleCreateProfile}
      />
    </div>
  );
}

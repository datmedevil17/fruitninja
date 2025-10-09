'use client'
import { useMemo, useState } from 'react';
import { initializeConfig, getProvider } from '@/services'
import { useWallet } from '@solana/wallet-adapter-react'
import { BN } from "@coral-xyz/anchor"

const Admin = () => {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const program = useMemo(
    () => getProvider(publicKey, signTransaction, sendTransaction),
    [publicKey, signTransaction, sendTransaction]
  );

  const handleInitializeConfig = async () => {
    if (!program) {
      setError("Program is not initialized. Please connect your wallet.");
      return;
    }

    if (!publicKey) {
      setError("PublicKey is not available. Please connect your wallet.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tx = await initializeConfig(
        program,
        publicKey,
        5,                    // max_lives: 5 lives per game
        new BN(10),        // max_points_per_fruit: 1000 points max per fruit
        new BN(2),           // combo_multiplier_base: 2x multiplier
        10                 // leaderboard_capacity: top 25 players
      );
      
      setSuccess(`Config initialized successfully! Transaction: ${tx}`);
      console.log("Transaction signature:", tx);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : String(err);
      setError(`Failed to initialize config: ${errorMessage}`);
      console.error("Error initializing config:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8 ">
      <div className="max-w-4xl mx-auto pt-20">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          🍎 Fruit Ninja Admin Panel
        </h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Initialize Game Configuration
          </h2>
          
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-white">
              <div className="bg-white/5 p-4 rounded-lg">
                <span className="font-semibold">Max Lives:</span> 5
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <span className="font-semibold">Max Points per Fruit:</span> 1000
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <span className="font-semibold">Combo Multiplier:</span> 2x
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <span className="font-semibold">Leaderboard Capacity:</span> 25
              </div>
            </div>
          </div>

          {/* Wallet Status */}
          <div className="mb-6">
            {publicKey ? (
              <div className="text-green-400">
                ✅ Wallet Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
              </div>
            ) : (
              <div className="text-red-400">
                ❌ Wallet not connected. Please connect your wallet to continue.
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
              <p className="text-red-200">❌ {error}</p>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4">
              <p className="text-green-200">✅ {success}</p>
            </div>
          )}

          {/* Initialize Button */}
          <button
            onClick={handleInitializeConfig}
            disabled={!publicKey || loading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
              !publicKey || loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:scale-105 active:scale-95'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Initializing...</span>
              </div>
            ) : (
              'Initialize Game Configuration'
            )}
          </button>

          <div className="mt-6 text-sm text-white/70">
            <p>⚠️ <strong>Important:</strong> This action can only be performed once and will set up the global game configuration on the blockchain.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin

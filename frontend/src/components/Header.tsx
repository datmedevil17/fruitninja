'use client'
import { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchProfile, getProvider, fetchConfig } from '@/services'
import Link from 'next/link'

// Define proper types
interface UserProfile {
  username: string;
  highScore?: number;
  // Add other profile properties as needed
}

interface GameConfig {
  maxLives: number;
  maxPointsPerFruit?: number;
  leaderboardCapacity: number;
  // Add other config properties as needed
}

export default function Header() {
  const [isMounted, setIsMounted] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const { publicKey, signTransaction, sendTransaction } = useWallet()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch game config when component mounts
  useEffect(() => {
    const getGameConfig = async () => {
      setIsLoadingConfig(true)
      try {
        const program = getProvider(publicKey, signTransaction, sendTransaction)
        if (!program) {
          console.log('Failed to get program provider for config')
          setIsLoadingConfig(false)
          return
        }

        const config = await fetchConfig(program)
        // Ensure config is not null and required fields are present
        if (
          config &&
          typeof config.maxLives === 'number' &&
          typeof config.leaderboardCapacity === 'number'
        ) {
          setGameConfig({
            maxLives: config.maxLives,
            leaderboardCapacity: config.leaderboardCapacity,
            maxPointsPerFruit: config.maxPointsPerFruit ? Number(config.maxPointsPerFruit) : undefined
            // Add other properties as needed, ensuring required fields are present
          })
        } else {
          setGameConfig(null)
        }
      } catch (error) {
        console.error('Error fetching game config:', error)
        setGameConfig(null)
      } finally {
        setIsLoadingConfig(false)
      }
    }

    getGameConfig()
  }, [publicKey, signTransaction, sendTransaction])

  // Fetch user profile when wallet connects
  useEffect(() => {
    const getUserProfile = async () => {
      if (!publicKey) {
        setUserProfile(null)
        return
      }

      setIsLoadingProfile(true)
      try {
        const program = getProvider(publicKey, signTransaction, sendTransaction)
        if (!program) {
          console.log('Failed to get program provider')
          setIsLoadingProfile(false)
          return
        }

        const profile = await fetchProfile(program, publicKey)
        setUserProfile(profile)
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setUserProfile(null)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    getUserProfile()
  }, [publicKey, signTransaction, sendTransaction])

  return (
    <header className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-black hover:text-gray-600 transition-colors">
            Fruit Ninja
          </Link>

          {/* Navigation & Status */}
          <div className="flex items-center gap-6">
            {/* Game Config */}
            {gameConfig && (
              <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
                <span>Lives: {gameConfig.maxLives}</span>
                <span>•</span>
                <span>Max: {gameConfig.maxPointsPerFruit?.toString() || 'N/A'}</span>
                <span>•</span>
                <span>Top: {gameConfig.leaderboardCapacity}</span>
              </div>
            )}

            {/* User Profile */}
            {publicKey && userProfile && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-800">
                <span className="font-medium">{userProfile.username}</span>
                <span className="text-gray-400">•</span>
                <span>{userProfile.highScore?.toString() || '0'}</span>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="hidden sm:flex items-center gap-4">
              <Link href="/game" className="text-gray-600 hover:text-black transition-colors">
                Play
              </Link>
              <Link href="/scores" className="text-gray-600 hover:text-black transition-colors">
                Scores
              </Link>
            </nav>

            {/* Wallet Button */}
            {isMounted && (
              <WalletMultiButton
                style={{ 
                  backgroundColor: '#000',
                  color: '#fff',
                  borderRadius: '6px',
                  border: 'none',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
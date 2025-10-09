// page.tsx
"use client";
import React, { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  startGameSession,
  checkActiveSession,
  delegateSession,
  sliceFruit,
  loseLife,
  undelegateSession,
  undelegateAndEndSession,
  getProvider,
} from "@/services";
import { MAGICBLOCK_RPC } from "@/utils/helpers";

const Page = () => {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});

  const programPromise = useMemo(() => {
    if (!publicKey) return null;
    return getProvider(publicKey, signTransaction, sendTransaction);
  }, [publicKey, signTransaction, sendTransaction]);

  const withProgram = async (fn: (program: any) => Promise<any>) => {
    if (!programPromise) {
      console.error("Wallet or program not available");
      return;
    }
    try {
      const program = await programPromise;
      return await fn(program);
    } catch (err) {
      console.error("Program error:", err);
      throw err;
    }
  };

  const createHandler = (key: string, fn: () => Promise<void>) => async () => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      await fn();
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleStartSession = createHandler('start', async () => {
    if (!publicKey || !programPromise) return;
    await withProgram((p) => startGameSession(p, publicKey));
    console.log("Start Session done");
  });

  const handleCheckActiveSession = createHandler('check', async () => {
    if (!publicKey || !programPromise) return;
    const res = await withProgram((p) => checkActiveSession(p, publicKey));
    console.log("Check Active Session:", res);
  });

  const handleDelegateSession = createHandler('delegate', async () => {
    if (!publicKey || !programPromise) return;
    const tx = await withProgram((p) => delegateSession(p, publicKey));
    console.log("Delegate tx:", tx);
  });

  const handleSliceFruit = createHandler('slice', async () => {
    if (!publicKey || !programPromise) return;
    const tx = await withProgram((p) => sliceFruit(p, publicKey, 100));
    console.log("Slice tx:", tx);
  });

  const handleLoseLife = createHandler('lose', async () => {
    if (!publicKey || !programPromise) return;
    const tx = await withProgram((p) => loseLife(p, publicKey));
    console.log("Lose life tx:", tx);
  });

  const handleUndelegateSession = createHandler('undelegate', async () => {
    if (!publicKey || !programPromise) return;
    const tx = await withProgram((p) => undelegateSession(p, publicKey));
    console.log("Undelegate tx:", tx);
  });

  const handleEndSession = createHandler('end', async () => {
    if (!publicKey || !programPromise) return;
    const tx = await withProgram((p) => undelegateAndEndSession(p, publicKey));
    console.log("End session tx:", tx);
  });

  const buttonStyle = (key: string, color = '#007bff') => ({
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: !publicKey || loadingStates[key] ? 'not-allowed' : 'pointer',
    backgroundColor: !publicKey ? '#6c757d' : loadingStates[key] ? '#ffc107' : color,
    color: 'white',
    transition: 'all 0.2s ease',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity: !publicKey ? 0.6 : 1,
    transform: loadingStates[key] ? 'scale(0.98)' : 'scale(1)',
  });

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "420px" }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Fruit Ninja Demo</h2>

      <div style={{ 
        marginBottom: "20px", 
        padding: "15px", 
        backgroundColor: publicKey ? "#d4edda" : "#f8d7da", 
        borderRadius: "8px",
        border: `2px solid ${publicKey ? "#c3e6cb" : "#f5c6cb"}`
      }}>
        {publicKey ? (
          <span style={{ color: "#155724", fontWeight: '600' }}>✅ Wallet Connected</span>
        ) : (
          <span style={{ color: "#721c24", fontWeight: '600' }}>❌ Please connect wallet</span>
        )}
      </div>

      <button 
        onClick={handleStartSession} 
        disabled={!publicKey || loadingStates.start}
        style={buttonStyle('start', '#28a745')}
      >
        {loadingStates.start ? '🔄 Starting...' : '🚀 Start Game Session'}
      </button>

      <button 
        onClick={handleCheckActiveSession} 
        disabled={!publicKey || loadingStates.check}
        style={buttonStyle('check', '#17a2b8')}
      >
        {loadingStates.check ? '🔄 Checking...' : '🔍 Check Active Session'}
      </button>

      <button 
        onClick={handleDelegateSession} 
        disabled={!publicKey || loadingStates.delegate}
        style={buttonStyle('delegate', '#6f42c1')}
      >
        {loadingStates.delegate ? '🔄 Delegating...' : '🔗 Delegate Session'}
      </button>

      <button 
        onClick={handleSliceFruit} 
        disabled={!publicKey || loadingStates.slice}
        style={buttonStyle('slice', '#fd7e14')}
      >
        {loadingStates.slice ? '🔄 Slicing...' : '🍎 Slice Fruit (100 pts)'}
      </button>

      <button 
        onClick={handleLoseLife} 
        disabled={!publicKey || loadingStates.lose}
        style={buttonStyle('lose', '#dc3545')}
      >
        {loadingStates.lose ? '🔄 Processing...' : '💔 Lose Life'}
      </button>

      <button 
        onClick={handleUndelegateSession} 
        disabled={!publicKey || loadingStates.undelegate}
        style={buttonStyle('undelegate', '#6c757d')}
      >
        {loadingStates.undelegate ? '🔄 Undelegating...' : '🔓 Undelegate Session'}
      </button>

      <button 
        onClick={handleEndSession} 
        disabled={!publicKey || loadingStates.end}
        style={buttonStyle('end', '#e83e8c')}
      >
        {loadingStates.end ? '🔄 Ending...' : '🏁 End Session'}
      </button>
    </div>
  );
};

export default Page;

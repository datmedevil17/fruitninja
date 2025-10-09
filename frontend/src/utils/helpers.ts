export const MAGICBLOCK_RPC = process.env.NEXT_PUBLIC_MAGICBLOCK_RPC || "https://devnet.magicblock.app";

// Useful helper (kept for compatibility)
export const getClusterURL = (cluster: string): string => {
  const clusterUrls: Record<string, string> = {
    "mainnet-beta": "https://api.mainnet-beta.solana.com",
    testnet: "https://api.testnet.solana.com",
    devnet: `https://devnet-rpc.shyft.to?api_key=${process.env.NEXT_PUBLIC_SHYFT_API_KEY}`,
    localhost: "http://127.0.0.1:8899",
  };
  return clusterUrls[cluster] ?? clusterUrls.devnet;
};

export function truncateAddress(address: string): string {
  if (!address) {
    throw new Error('Invalid address')
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}
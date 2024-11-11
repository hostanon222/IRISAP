import { useWallet } from '@/contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Toast from './Toast';

export default function WalletButton() {
  const { publicKey, connecting, connect, disconnect } = useWallet();
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={publicKey ? handleDisconnect : handleConnect}
        className="px-4 py-2 border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors rounded-full font-mono flex items-center gap-2"
        disabled={connecting}
      >
        {connecting ? (
          <>
            <div className="w-3 h-3 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
            Connecting...
          </>
        ) : publicKey ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {`${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`}
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 9h-2V7h2v2zm0 2h-2v6h2v-6zm-1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            Connect Wallet
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {error && (
          <Toast 
            message={error}
            type="error"
            onClose={() => setError(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
} 
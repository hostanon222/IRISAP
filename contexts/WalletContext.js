import { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const checkPhantom = async () => {
      try {
        const isPhantomInstalled = window?.solana?.isPhantom;
        if (isPhantomInstalled) {
          const solana = window.solana;
          setWallet(solana);
          
          solana.on('connect', (publicKey) => {
            console.log('Wallet connected:', publicKey.toBase58());
            setPublicKey(publicKey.toBase58());
          });

          solana.on('disconnect', () => {
            console.log('Wallet disconnected');
            setPublicKey(null);
          });

          if (solana.isConnected) {
            setPublicKey(solana.publicKey.toBase58());
          }
        }
      } catch (error) {
        console.error('Phantom wallet error:', error);
      }
    };

    if (typeof window !== 'undefined') {
      checkPhantom();
    }
  }, []);

  const connect = async () => {
    try {
      setConnecting(true);
      if (!wallet) {
        throw new Error('Phantom wallet not installed');
      }

      await wallet.connect();
    } catch (error) {
      if (error.message.includes('User rejected')) {
        throw new Error('Connection cancelled');
      } else if (!wallet) {
        throw new Error('Please install Phantom wallet');
      } else {
        throw new Error('Failed to connect wallet');
      }
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (!wallet) {
        throw new Error('No wallet connected');
      }
      await wallet.disconnect();
      setPublicKey(null);
    } catch (error) {
      throw new Error('Failed to disconnect wallet');
    }
  };

  return (
    <WalletContext.Provider value={{ 
      wallet,
      publicKey,
      connecting,
      connect,
      disconnect
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 
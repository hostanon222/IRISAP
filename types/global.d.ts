interface Window {
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    on: (event: string, callback: Function) => void;
    publicKey: { toBase58: () => string };
    isConnected: boolean;
  };
} 
import "@/styles/globals.css";
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { WalletProvider } from '@/contexts/WalletContext';

export default function App({ Component, pageProps }) {
  return (
    <WalletProvider>
      <WebSocketProvider>
        <Component {...pageProps} />
      </WebSocketProvider>
    </WalletProvider>
  );
}

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ArtworkRenderer from '@/components/ArtworkRenderer';
import { useRouter } from 'next/router';
import WalletButton from '@/components/WalletButton';
import { AI_CONFIG } from '@/utils/config';

export default function Gallery() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/gallery');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch artworks');
      }
      
      const validArtworks = (data.artworks || []).filter(artwork => 
        artwork?.drawingInstructions?.elements?.length > 0
      );
      
      setArtworks(validArtworks);
      
    } catch (error) {
      console.error('Error fetching artworks:', error);
      setError(error.message);
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArtworkClick = (artwork) => {
    setSelectedArtwork(artwork);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-green-500 font-mono text-2xl">Gallery</h1>
            <div className="flex items-center gap-3">
              <WalletButton />
              <a
                href={AI_CONFIG.twitterLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors rounded font-mono"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-sm">@IRISAISOLANA</span>
              </a>
              <Link 
                href="/"
                className="px-4 py-2 border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors rounded font-mono"
              >
                Back to Generator
              </Link>
            </div>
          </div>
          <div className="text-red-500 font-mono p-4 border border-red-500/30 rounded">
            Error: {error}
            <button 
              onClick={fetchArtworks}
              className="ml-4 px-3 py-1 border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-green-500 font-mono text-2xl">Gallery</h1>
          <div className="flex items-center gap-3">
            <WalletButton />
            <a
              href={AI_CONFIG.twitterLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors rounded font-mono"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-sm">@IRISAISOLANA</span>
            </a>
            <Link 
              href="/"
              className="px-4 py-2 border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors rounded font-mono"
            >
              Back to Generator
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-green-500 animate-pulse">Loading artworks...</div>
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-green-500/70 font-mono text-center p-8">
            No artworks found. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {artworks.map((artwork) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="relative aspect-video cursor-pointer group"
                  onClick={() => router.push(`/artwork/${artwork.id}`)}
                >
                  <div className="absolute inset-0 border border-green-500/30 group-hover:border-green-500 transition-all duration-300 rounded-lg overflow-hidden backdrop-blur-sm">
                    <div className="w-full h-full">
                      <ArtworkRenderer 
                        instructions={artwork.drawingInstructions}
                        width={800}
                        height={400}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-green-500 font-mono text-sm mb-2">
                        {artwork.description?.substring(0, 100)}...
                      </p>
                      {artwork.reflection && (
                        <p className="text-green-500/70 font-mono text-xs line-clamp-2">
                          {artwork.reflection}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedArtwork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedArtwork(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full bg-black border border-green-500/30 rounded-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="aspect-video">
                <ArtworkRenderer 
                  instructions={selectedArtwork.drawingInstructions}
                  width={1600}
                  height={800}
                />
              </div>
              <div className="p-6">
                <h3 className="text-green-500 font-mono text-lg mb-4">
                  {selectedArtwork.description}
                </h3>
                <p className="text-green-500/70 font-mono text-sm">
                  {selectedArtwork.reflection}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
} 
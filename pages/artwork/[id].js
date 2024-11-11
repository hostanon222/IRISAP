import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ArtworkRenderer from '@/components/ArtworkRenderer';
import { AI_CONFIG } from '@/utils/config';

export default function ArtworkDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('concept');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArtwork();
    }
  }, [id]);

  async function fetchArtwork() {
    try {
      setLoading(true);
      const response = await fetch(`/api/gallery/${id}`);
      const data = await response.json();
      setArtwork(data);
    } catch (error) {
      console.error('Error fetching artwork:', error);
    } finally {
      setLoading(false);
    }
  }

  function downloadArtwork() {
    const canvas = document.querySelector('#artworkCanvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `iris-artwork-${id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(artwork.drawingInstructions, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"/>
          <p className="text-green-500 font-mono animate-pulse">Loading artwork...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-green-500 font-mono text-xl">Artwork not found</p>
          <Link 
            href="/gallery"
            className="inline-block px-4 py-2 border border-green-500 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors font-mono"
          >
            Return to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500">
      {/* Fixed Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full bg-black/95 border-b border-green-500/30 backdrop-blur-md z-50"
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/gallery" className="group flex items-center gap-2 hover:text-green-400 transition-colors">
              <motion.svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                whileHover={{ x: -3 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </motion.svg>
              <span className="font-mono group-hover:underline">Gallery</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCode(!showCode)}
              className="px-3 py-1.5 border border-green-500/50 rounded hover:bg-green-500/10 transition-colors font-mono text-sm"
            >
              {showCode ? 'Show Artwork' : 'View Code'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadArtwork}
              className="px-3 py-1.5 border border-green-500/50 rounded hover:bg-green-500/10 transition-colors font-mono text-sm"
            >
              Download
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyCode}
              className="px-3 py-1.5 border border-green-500/30 rounded hover:bg-green-500/10 transition-colors font-mono text-sm"
            >
              Copy Code
            </motion.button>
            <motion.button
              whileHover={{ opacity: 0.7 }}
              disabled
              className="px-3 py-1.5 border border-green-500/20 rounded text-green-500/50 font-mono text-sm cursor-not-allowed"
            >
              Mint NFT
            </motion.button>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={AI_CONFIG.twitterLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 border border-green-500 rounded hover:bg-green-500/10 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </motion.a>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-16">
        <div className="container mx-auto px-4 grid grid-cols-3 gap-6 h-[calc(100vh-4rem)]">
          {/* Artwork Display/Code View */}
          <motion.div 
            layout
            className="col-span-2 h-full flex flex-col"
          >
            <div className="flex-1 border border-green-500/30 rounded-lg overflow-hidden bg-black">
              <AnimatePresence mode="wait">
                {showCode ? (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative h-full"
                  >
                    <pre className="p-4 h-full overflow-auto font-mono text-sm text-green-500/90 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent">
                      {JSON.stringify(artwork.drawingInstructions, null, 2)}
                    </pre>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={copyCode}
                        className="px-2 py-1 text-xs border border-green-500/30 rounded hover:bg-green-500/10"
                      >
                        Copy
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="artwork"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex items-center justify-center bg-black/50 backdrop-blur-sm"
                  >
                    <div className="w-[800px] h-[400px] relative group">
                      <ArtworkRenderer 
                        id="artworkCanvas"
                        instructions={artwork.drawingInstructions}
                        width={800}
                        height={400}
                      />
                      <motion.div 
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute bottom-4 right-4 flex gap-2"
                      >
                        <button
                          onClick={downloadArtwork}
                          className="px-3 py-1.5 text-sm bg-black/80 border border-green-500/30 rounded hover:bg-green-500/10 backdrop-blur-sm"
                        >
                          Download
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Info Panel */}
          <motion.div layout className="h-full flex flex-col">
            <div className="flex border-b border-green-500/30">
              {['concept', 'reflection', 'metadata'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2 font-mono text-sm capitalize relative transition-colors ${
                    activeTab === tab 
                      ? 'text-green-500' 
                      : 'text-green-500/50 hover:text-green-500/70'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                    />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent p-4"
              >
                {activeTab === 'concept' && (
                  <div className="prose prose-invert prose-green max-w-none">
                    <h3 className="text-lg font-mono mb-4">Original Concept</h3>
                    <div className="font-mono text-sm text-green-500/90 leading-relaxed">
                      {artwork.description}
                    </div>
                  </div>
                )}
                {activeTab === 'reflection' && (
                  <div className="prose prose-invert prose-green max-w-none">
                    <h3 className="text-lg font-mono mb-4">IRIS's Reflection</h3>
                    <div className="font-mono text-sm text-green-500/90 leading-relaxed">
                      {artwork.reflection}
                    </div>
                  </div>
                )}
                {activeTab === 'metadata' && (
                  <dl className="font-mono text-sm space-y-4">
                    <div className="border border-green-500/20 rounded-lg p-3">
                      <dt className="text-green-500/50 mb-1">Created</dt>
                      <dd>{new Date(artwork.createdAt).toLocaleString()}</dd>
                    </div>
                    <div className="border border-green-500/20 rounded-lg p-3">
                      <dt className="text-green-500/50 mb-1">Complexity</dt>
                      <dd>{artwork.complexity.toFixed(2)}</dd>
                    </div>
                    <div className="border border-green-500/20 rounded-lg p-3">
                      <dt className="text-green-500/50 mb-1">Elements</dt>
                      <dd>{artwork.drawingInstructions.elements.length}</dd>
                    </div>
                    <div className="border border-green-500/20 rounded-lg p-3">
                      <dt className="text-green-500/50 mb-1">Total Points</dt>
                      <dd>{artwork.drawingInstructions.elements.reduce((sum, el) => sum + el.points.length, 0)}</dd>
                    </div>
                  </dl>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* Toast Messages */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 px-4 py-2 bg-green-500 text-black rounded-lg font-mono text-sm"
          >
            Code copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
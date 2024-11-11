import { useWebSocket } from '@/contexts/WebSocketContext';
import { useEffect, useState, useRef } from 'react';
import { AI_CONFIG, CANVAS_CONFIG } from '@/utils/config';
import Loading from '@/components/Loading';
import CanvasLoader from '@/components/CanvasLoader';
import PhaseProgress from '@/components/PhaseProgress';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/router';

function ScrollableText({ text, maxHeight = "200px", className = "" }) {
  return (
    <div 
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/50 scrollbar-track-transparent ${className}`}
      style={{ maxHeight }}
    >
      <p className="text-green-400/90 whitespace-pre-wrap font-mono text-sm leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function CodeStream({ instructions, isLive = false }) {
  const [visibleCode, setVisibleCode] = useState('');
  
  useEffect(() => {
    if (!instructions) return;
    
    if (!isLive) {
      setVisibleCode(JSON.stringify(instructions, null, 2));
      return;
    }
    
    const code = JSON.stringify(instructions, null, 2);
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < code.length) {
        setVisibleCode(prev => prev + code[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [instructions, isLive]);

  return (
    <div className="mt-4 bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b border-green-500/30">
        <div className="flex items-center gap-2">
          {isLive && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>}
          <span className="text-xs font-mono text-green-500/70">
            {isLive ? 'Live Drawing Instructions' : 'Drawing Instructions'}
          </span>
        </div>
        <span className="text-xs font-mono text-green-500/50">
          {instructions.elements.length} elements
        </span>
      </div>
      <div className="relative">
        <pre className="p-3 text-[10px] font-mono text-green-500/50 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent">
          {visibleCode}
        </pre>
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"/>
      </div>
    </div>
  );
}

function getPhaseMessage(phase, idea, reflection, lastGenerated) {
  switch (phase) {
    case 'ideation':
      return {
        title: 'Concept',
        content: idea || ''
      };
    case 'creation':
      return {
        title: 'Artwork',
        content: idea || ''
      };
    case 'reflection':
      return {
        title: 'Reflection',
        content: reflection || ''
      };
    case 'storage':
      return {
        title: 'Saving',
        content: 'Preserving artwork in gallery...'
      };
    case 'completed':
      return {
        title: 'Complete',
        content: 'Generation complete! View this piece in the gallery.',
        isComplete: true
      };
    case 'waiting':
      return {
        title: 'Resting',
        content: lastGenerated ? 
          `Last artwork generated at ${new Date(lastGenerated.timestamp).toLocaleTimeString()}. View it in the gallery.` :
          'Waiting for next generation cycle...',
        isComplete: true
      };
    default:
      return null;
  }
}

function IrisMessage({ message, type = "info", artworkId }) {
  const [expanded, setExpanded] = useState(false);
  const messageRef = useRef(null);
  const router = useRouter();

  // Check if message exists and has content
  const isLong = message?.content?.length > 150;

  useEffect(() => {
    messageRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [message]);

  if (!message || !message.content) return null;

  return (
    <motion.div
      ref={messageRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-black/40 backdrop-blur-sm border border-green-500/30 rounded-lg overflow-hidden"
    >
      {/* Title Bar */}
      <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image 
            src="/image.png"
            alt="IRIS AI"
            width={20}
            height={20}
            className="object-contain"
          />
          <h3 className="text-green-500 font-mono text-sm font-bold">
            {message.title}
          </h3>
        </div>
        {message.isComplete && (
          <button
            onClick={() => router.push('/gallery')}
            className="text-xs text-green-500/70 hover:text-green-500 transition-colors flex items-center gap-1"
          >
            View in Gallery
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 5l7 7-7 7M5 12h14"/>
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-green-500/90 font-mono text-sm leading-relaxed">
          {isLong && !expanded ? (
            <motion.div layout>
              {message.content.substring(0, 150)}
              <span className="text-green-500/50">...</span>
              <button 
                onClick={() => setExpanded(true)}
                className="ml-2 text-xs text-green-500/50 hover:text-green-500 transition-colors underline"
              >
                Read More
              </button>
            </motion.div>
          ) : (
            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {message.content}
              {isLong && (
                <button 
                  onClick={() => setExpanded(false)}
                  className="ml-2 text-xs text-green-500/50 hover:text-green-500 transition-colors underline"
                >
                  Show Less
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { 
    wsClient, 
    status, 
    stats, 
    currentIdea, 
    currentPhase, 
    currentReflection,
    lastGenerated,
    drawingInstructions
  } = useWebSocket();

  const [statusText, setStatusText] = useState('');
  const [messages, setMessages] = useState([]);
  const [completedArtworkId, setCompletedArtworkId] = useState(null);

  // Load last generated artwork on mount
  useEffect(() => {
    if (lastGenerated) {
      const canvas = document.getElementById('artCanvas');
      if (canvas && lastGenerated.instructions) {
        const ctx = canvas.getContext('2d');
        // Draw the last generated artwork
        drawArtwork(ctx, lastGenerated.instructions);
      }
    }
  }, [lastGenerated]);

  // Status indicator component
  const StatusIndicator = () => (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-500/30">
      <div className={`w-2 h-2 rounded-full ${
        status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
        currentPhase === 'ideation' ? 'bg-blue-500 animate-pulse' :
        currentPhase === 'creation' ? 'bg-purple-500 animate-pulse' :
        currentPhase === 'reflection' ? 'bg-indigo-500 animate-pulse' :
        currentPhase === 'storage' ? 'bg-orange-500 animate-pulse' :
        'bg-green-500'
      }`} />
      <span className="text-green-500/90 font-mono text-xs">
        {status === 'connecting' ? 'Connecting...' :
         currentPhase === 'ideation' ? 'Generating Concept' :
         currentPhase === 'creation' ? 'Creating Artwork' :
         currentPhase === 'reflection' ? 'Reflecting' :
         currentPhase === 'storage' ? 'Saving Artwork' :
         'Resting'}
      </span>
    </div>
  );

  // Helper function to draw artwork
  const drawArtwork = (ctx, instructions) => {
    ctx.clearRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);
    ctx.fillStyle = instructions.background || '#000000';
    ctx.fillRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);

    instructions.elements.forEach(element => {
      ctx.beginPath();
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.stroke_width;

      switch (element.type) {
        case 'circle':
          const [x, y] = element.points[0];
          const radius = element.points[1] ? 
            Math.hypot(element.points[1][0] - x, element.points[1][1] - y) : 
            50;
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          break;

        case 'line':
        case 'wave':
        case 'spiral':
          element.points.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point[0], point[1]);
            else ctx.lineTo(point[0], point[1]);
          });
          break;
      }

      if (element.closed) ctx.closePath();
      ctx.stroke();
    });
  };

  // Update IRIS messages when phase changes
  useEffect(() => {
    if (currentPhase && currentPhase !== 'initializing') {
      const phaseMessage = getPhaseMessage(currentPhase, currentIdea, currentReflection, lastGenerated);
      if (phaseMessage) {
        const lastMessage = messages[messages.length - 1]?.text;
        const isLastMessageComplete = lastMessage?.title === 'Complete';
        const isNewMessageComplete = phaseMessage.title === 'Complete';

        if (!(isLastMessageComplete && isNewMessageComplete)) {
          const newMessage = {
            id: Date.now(),
            text: phaseMessage,
            type: 'phase',
            artworkId: completedArtworkId
          };
          setMessages(prev => [...prev.slice(-4), newMessage]);
        }
      }
    }
  }, [currentPhase, currentIdea, currentReflection, completedArtworkId, lastGenerated]);

  // Clear canvas when starting new generation
  useEffect(() => {
    if (currentPhase === 'ideation') {
      const canvas = document.getElementById('artCanvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);
      }
    }
  }, [currentPhase]);

  return (
    <main className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-green-500 flex items-center justify-center overflow-hidden">
              <Image 
                src="/image.png"
                alt="IRIS AI"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-green-500 font-mono text-xl">{AI_CONFIG.name}</h1>
              <p className="text-green-500/70 font-mono text-xs">{AI_CONFIG.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
              href="/gallery" 
              className="px-4 py-2 border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors rounded font-mono"
            >
              Gallery
            </Link>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="mb-4">
          <PhaseProgress currentPhase={currentPhase} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Canvas Container */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video bg-black border border-green-500/30 rounded-lg overflow-hidden">
              <canvas 
                id="artCanvas"
                width={CANVAS_CONFIG.width}
                height={CANVAS_CONFIG.height}
                className="w-full h-full"
              />
              {status === 'connecting' && <CanvasLoader />}
              <StatusIndicator />
              {currentPhase === 'resting' && lastGenerated && (
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-green-500/30">
                  <p className="text-green-500/90 font-mono text-xs">
                    Last Generated: {new Date(lastGenerated.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
            {/* Code Stream - Now with isLive prop */}
            {drawingInstructions && (
              <CodeStream 
                instructions={drawingInstructions} 
                isLive={currentPhase === 'creation'}
              />
            )}
          </div>

          {/* IRIS Communication Panel */}
          <div className="lg:col-span-1 h-full">
            <div className="border border-green-500/30 rounded-lg bg-black/20 backdrop-blur-sm h-full flex flex-col">
              <div className="p-4 border-b border-green-500/30 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-green-500/50 flex items-center justify-center overflow-hidden">
                    <Image 
                      src="/image.png"
                      alt="IRIS AI"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-green-500 font-mono text-sm">IRIS Communication</h2>
                    <p className="text-green-500/50 font-mono text-xs">AI Art Generator</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    currentPhase === 'ideation' ? 'bg-blue-500 animate-pulse' :
                    currentPhase === 'creation' ? 'bg-purple-500 animate-pulse' :
                    currentPhase === 'reflection' ? 'bg-indigo-500 animate-pulse' :
                    'bg-green-500'
                  }`} />
                  <span className="text-xs font-mono text-green-500/70">
                    {currentPhase === 'ideation' ? 'Thinking' :
                     currentPhase === 'creation' ? 'Creating' :
                     currentPhase === 'reflection' ? 'Reflecting' :
                     'Resting'}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                  {messages.map(msg => (
                    <IrisMessage 
                      key={msg.id} 
                      message={msg.text} 
                      type={msg.type} 
                      artworkId={msg.artworkId} 
                    />
                  ))}
                </AnimatePresence>
                
                {/* Typing Indicator when IRIS is active */}
                {currentPhase !== 'completed' && currentPhase !== 'waiting' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-green-500/50 text-sm font-mono"
                  >
                    <div className="flex gap-1">
                      <span className="w-1 h-1 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>IRIS is {
                      currentPhase === 'ideation' ? 'thinking' :
                      currentPhase === 'creation' ? 'creating' :
                      currentPhase === 'reflection' ? 'reflecting' :
                      'processing'
                    }...</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        {stats && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-green-500/50 font-mono text-xs flex items-center justify-between"
          >
            <div>
              Total Creations: {stats.totalCreations || 0} | 
              Total Pixels: {stats.totalPixels || 0} | 
              Viewers: {stats.viewers || 0}
            </div>
            <div className="text-right">
              {currentPhase !== 'resting' && (
                <span className="animate-pulse">
                  {currentPhase === 'ideation' ? 'Generating concept...' :
                   currentPhase === 'creation' ? 'Creating artwork...' :
                   currentPhase === 'reflection' ? 'Contemplating creation...' :
                   'Processing...'}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

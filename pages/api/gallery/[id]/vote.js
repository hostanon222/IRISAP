import prisma from '@/utils/db';

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 votes per minute
const ipVotes = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const userVotes = ipVotes.get(ip) || [];
  
  // Remove old votes
  const recentVotes = userVotes.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentVotes.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  // Add new vote timestamp
  recentVotes.push(now);
  ipVotes.set(ip, recentVotes);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Check rate limit
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ message: 'Too many votes. Please try again later.' });
  }

  try {
    // Update artwork votes in a transaction
    const updatedArtwork = await prisma.$transaction(async (tx) => {
      // Check if IP already voted for this artwork
      const existingVote = await tx.userVote.findFirst({
        where: {
          userId: ip,
          artworkId: id
        }
      });

      if (existingVote) {
        return {
          error: 'Already voted',
          artwork: await tx.artwork.findUnique({
            where: { id },
            include: {
              _count: {
                select: {
                  userVotes: true
                }
              }
            }
          })
        };
      }

      // Create vote record
      await tx.userVote.create({
        data: {
          userId: ip,
          artworkId: id
        }
      });

      // Get updated artwork with vote count
      const artwork = await tx.artwork.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              userVotes: true
            }
          }
        }
      });

      // Update global stats
      await tx.stats.upsert({
        where: { id: 'global' },
        create: {
          totalVotes: 1
        },
        update: {
          totalVotes: { increment: 1 }
        }
      });

      return { artwork };
    });

    if (updatedArtwork.error) {
      return res.status(400).json({ 
        message: updatedArtwork.error,
        votes: updatedArtwork.artwork._count.userVotes
      });
    }

    return res.status(200).json({ 
      success: true,
      votes: updatedArtwork.artwork._count.userVotes
    });
  } catch (error) {
    console.error('Vote API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
}; 
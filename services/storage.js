const prisma = require('../utils/db');

class StorageService {
  constructor() {
    this.prisma = prisma;
    console.log('📦 Storage Service initialized');
    this._validateConnection();
  }

  async _validateConnection() {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connection established');
      await this._initializeStats();
    } catch (error) {
      console.error('❌ Database connection error:', error);
      throw new Error('Failed to connect to database');
    }
  }

  async _initializeStats() {
    const artworkCount = await this.prisma.artwork.count();
    const totalPixels = await this.prisma.artwork.aggregate({
      _sum: {
        pixelCount: true
      }
    });

    await this.prisma.stats.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        totalCreations: artworkCount,
        totalPixels: totalPixels._sum.pixelCount || 0,
        totalVotes: 0
      },
      update: {
        totalCreations: artworkCount,
        totalPixels: totalPixels._sum.pixelCount || 0
      }
    });

    console.log('📊 Stats initialized:');
    console.log(`   Total Creations: ${artworkCount}`);
    console.log(`   Total Pixels: ${totalPixels._sum.pixelCount || 0}`);
  }

  async saveArtwork({ drawingInstructions, description, reflection }) {
    console.log('\n=== Saving Artwork ===');
    
    try {
      const pixelCount = this._calculatePixelCount(drawingInstructions);
      
      const result = await this.prisma.$transaction(async (tx) => {
        const artwork = await tx.artwork.create({
          data: {
            drawingInstructions,
            description,
            reflection,
            pixelCount,
            phase: 'completed',
            complexity: this._calculateComplexity(drawingInstructions)
          }
        });

        const currentStats = await tx.stats.findUnique({
          where: { id: 'global' }
        });

        const stats = await tx.stats.upsert({
          where: { id: 'global' },
          create: {
            id: 'global',
            totalCreations: 1,
            totalPixels: pixelCount,
            totalVotes: 0
          },
          update: {
            totalCreations: (currentStats?.totalCreations || 0) + 1,
            totalPixels: (currentStats?.totalPixels || 0) + pixelCount
          }
        });

        console.log('✅ Artwork saved successfully');
        console.log('🔑 ID:', artwork.id);
        console.log('📊 Stats Updated:');
        console.log(`   Total Creations: ${stats.totalCreations}`);
        console.log(`   Total Pixels: ${stats.totalPixels}`);
        console.log('===================\n');

        return { artwork, stats };
      });

      return result;
    } catch (error) {
      console.error('❌ Error saving artwork:', error);
      throw new Error(`Failed to save artwork: ${error.message}`);
    }
  }

  async getStats() {
    try {
      const artworkCount = await this.prisma.artwork.count();
      
      const totalPixels = await this.prisma.artwork.aggregate({
        _sum: {
          pixelCount: true
        }
      });

      const stats = await this.prisma.stats.upsert({
        where: { id: 'global' },
        create: {
          id: 'global',
          totalCreations: artworkCount,
          totalPixels: totalPixels._sum.pixelCount || 0,
          totalVotes: 0
        },
        update: {
          totalCreations: artworkCount,
          totalPixels: totalPixels._sum.pixelCount || 0
        }
      });

      console.log('📊 Current Stats:');
      console.log(`   Total Creations: ${stats.totalCreations}`);
      console.log(`   Total Pixels: ${stats.totalPixels}`);

      return stats;
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }
  }

  async getArtworks(limit = 50) {
    console.log(`📚 Fetching ${limit} most recent artworks...`);
    try {
      const artworks = await this.prisma.artwork.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        select: {
          id: true,
          drawingInstructions: true,
          description: true,
          reflection: true,
          createdAt: true,
          votes: true,
          complexity: true,
          pixelCount: true
        }
      });

      console.log(`✅ Retrieved ${artworks.length} artworks`);
      return artworks;
    } catch (error) {
      console.error('❌ Error fetching artworks:', error);
      throw new Error(`Failed to fetch artworks: ${error.message}`);
    }
  }

  _calculatePixelCount(instructions) {
    return instructions.elements.reduce((count, element) => {
      const pointCount = element.points?.length || 0;
      switch (element.type) {
        case 'circle':
          const [x, y] = element.points[0];
          const radius = element.points[1] ? 
            Math.hypot(element.points[1][0] - x, element.points[1][1] - y) : 
            50;
          return count + Math.ceil(2 * Math.PI * radius);
        case 'line':
          return count + (pointCount - 1) * 10;
        case 'wave':
        case 'spiral':
          return count + pointCount * 20;
        default:
          return count + pointCount * 10;
      }
    }, 0);
  }

  _calculateComplexity(instructions) {
    const elementWeights = {
      circle: 1,
      line: 1,
      wave: 2,
      spiral: 3
    };

    return Math.min(instructions.elements.reduce((score, element) => 
      score + (elementWeights[element.type] || 1) * (element.points?.length || 0), 0) / 100, 5);
  }

  async getArtwork(id) {
    console.log(`📚 Fetching artwork ${id}...`);
    try {
      const artwork = await this.prisma.artwork.findUnique({
        where: { id },
        select: {
          id: true,
          drawingInstructions: true,
          description: true,
          reflection: true,
          createdAt: true,
          votes: true,
          complexity: true,
          pixelCount: true
        }
      });

      console.log(artwork ? '✅ Artwork found' : '⚠️ Artwork not found');
      return artwork;
    } catch (error) {
      console.error('❌ Error fetching artwork:', error);
      throw new Error(`Failed to fetch artwork: ${error.message}`);
    }
  }
}

module.exports = {
  storageService: new StorageService()
}; 
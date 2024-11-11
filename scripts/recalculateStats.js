const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateStats() {
  try {
    // Get all artworks
    const artworks = await prisma.artwork.findMany();
    
    // Calculate totals
    const totalCreations = artworks.length;
    const totalPixels = artworks.reduce((sum, artwork) => sum + artwork.pixelCount, 0);

    // Update stats
    await prisma.stats.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        totalCreations,
        totalPixels,
        totalVotes: 0
      },
      update: {
        totalCreations,
        totalPixels
      }
    });

    console.log('Stats recalculated:');
    console.log(`Total Creations: ${totalCreations}`);
    console.log(`Total Pixels: ${totalPixels}`);

  } catch (error) {
    console.error('Error recalculating stats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recalculateStats(); 
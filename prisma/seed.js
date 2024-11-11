import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create initial stats
  await prisma.stats.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      totalCreations: 0,
      totalPixels: 0,
      totalVotes: 0
    }
  });

  // Add some sample artworks if needed
  await prisma.artwork.createMany({
    data: [
      {
        imageUrl: 'https://via.placeholder.com/800x400/000000/00ff00',
        description: 'Geometric pattern with intersecting circles',
        reflection: 'A study in circular harmony',
        votes: 10,
      },
      {
        imageUrl: 'https://via.placeholder.com/800x400/000000/00ff00',
        description: 'Spiral pattern with varying line weights',
        reflection: 'Exploring mathematical beauty',
        votes: 5,
      }
    ],
    skipDuplicates: true
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
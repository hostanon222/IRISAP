const { PrismaClient } = require('@prisma/client');
const { ENV } = require('./env');

let prisma;

if (ENV.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: ENV.DATABASE_URL
      }
    }
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn']
    });
  }
  prisma = global.prisma;
}

module.exports = prisma; 
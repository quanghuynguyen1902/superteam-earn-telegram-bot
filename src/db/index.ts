import { logger } from '../utils/logger';

// Initialize Prisma clients with proper error handling
let BotPrismaClient: any;
let EarnPrismaClient: any;
let botDb: any;
let earnDb: any;

try {
  // Import bot client
  const botClientModule = require('../../node_modules/.prisma/bot-client');
  BotPrismaClient = botClientModule.PrismaClient;
  
  if (!BotPrismaClient) {
    throw new Error('BotPrismaClient not found in module');
  }
  
  botDb = new BotPrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });
  
  logger.info('Bot Prisma client initialized');
} catch (error) {
  logger.error('Failed to initialize bot Prisma client:', error);
  console.error('Please ensure you have run: npx prisma generate --schema=prisma/bot-schema.prisma');
  process.exit(1);
}

try {
  // Import earn client
  const earnClientModule = require('../../node_modules/.prisma/earn-client');
  EarnPrismaClient = earnClientModule.PrismaClient;
  
  if (!EarnPrismaClient) {
    throw new Error('EarnPrismaClient not found in module');
  }
  
  earnDb = new EarnPrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });
  
  logger.info('Earn Prisma client initialized');
} catch (error) {
  logger.error('Failed to initialize earn Prisma client:', error);
  console.error('Please ensure you have run: npx prisma generate --schema=prisma/earn-schema.prisma');
  process.exit(1);
}

// Export the clients
export { botDb, earnDb };

// Logging setup
botDb.$on("query", (e: { query: any; duration: any }) => {
  logger.debug("Bot DB Query", { query: e.query, duration: e.duration });
});

botDb.$on("error", (e: any) => {
  logger.error("Bot DB Error", e);
});

earnDb.$on("error", (e: any) => {
  logger.error("Earn DB Error", e);
});

// Connection health checks
export const checkDatabaseConnections = async () => {
  try {
    await botDb.$queryRaw`SELECT 1`;
    logger.info('Bot database connection: ✅');
  } catch (error) {
    logger.error('Bot database connection failed:', error);
    throw new Error('Bot database connection failed');
  }

  try {
    await earnDb.$queryRaw`SELECT 1`;
    logger.info('Earn database connection: ✅');
  } catch (error) {
    logger.error('Earn database connection failed:', error);
    throw new Error('Earn database connection failed');
  }
};

// Graceful shutdown
export const disconnectDatabases = async () => {
  try {
    await botDb.$disconnect();
    await earnDb.$disconnect();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

// Handle process termination
process.on('beforeExit', disconnectDatabases);
process.on('SIGINT', disconnectDatabases);
process.on('SIGTERM', disconnectDatabases);

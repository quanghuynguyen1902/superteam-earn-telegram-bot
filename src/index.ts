import { createBot, launchBot } from './bot';
import { validateConfig } from './config';
import { logger } from './utils/logger';
import { checkDatabaseConnections, disconnectDatabases } from './db';
import { NotificationScheduler } from './services/notification-scheduler';

async function startApplication() {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated');

    // Check database connections
    await checkDatabaseConnections();
    logger.info('Database connections verified');

    // Create and launch Telegram bot
    const bot = createBot();
    
    // Create notification scheduler
    const scheduler = new NotificationScheduler(bot);
    scheduler.start();

    // Launch Telegram bot
    await launchBot(bot);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      scheduler.stop();
      await scheduler.cleanup();
      await disconnectDatabases();
      
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

// Start the application
startApplication();
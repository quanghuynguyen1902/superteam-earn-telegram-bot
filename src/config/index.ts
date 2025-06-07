import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  notifications: {
    delayHours: parseInt(process.env.NOTIFICATION_DELAY_HOURS || '12', 10),
    batchSize: parseInt(process.env.BATCH_SIZE || '100', 10),
    rateLimitPerSecond: parseInt(process.env.RATE_LIMIT_PER_SECOND || '30', 10),
  },
  telegram_bot_url: process.env.TELEGRAM_BOT_URL || '',
};

export const validateConfig = (): void => {
  const requiredEnvVars = [
    'TELEGRAM_BOT_TOKEN',
    'BOT_DATABASE_URL',
    'EARN_DATABASE_URL',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};
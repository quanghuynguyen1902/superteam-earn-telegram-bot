import { Telegraf } from 'telegraf';
import { BotContext } from './index';
import { UserModel } from '../db/models/user';
import { logger } from '../utils/logger';

export const setupMiddleware = (bot: Telegraf<BotContext>): void => {
  // User authentication middleware
  bot.use(async (ctx, next) => {
    if (!ctx.from) {
      return next();
    }

    try {
      const telegramId = ctx.from.id;

      // Check if user exists
      let user = await UserModel.findByTelegramId(telegramId);

      if (!user) {
        // Create new user
        user = await UserModel.create(telegramId);
        logger.info('New user created', { telegramId });
      }

      // Attach user info to context
      ctx.userId = user.id;
      ctx.telegramId = telegramId;
    } catch (error) {
      logger.error('Middleware error', error);
    }

    return next();
  });

  // Rate limiting middleware (simple in-memory implementation)
  const rateLimits = new Map<number, number[]>();
  const RATE_LIMIT = 30; // messages per minute
  const WINDOW = 60000; // 1 minute

  bot.use(async (ctx, next) => {
    if (!ctx.from) {
      return next();
    }

    const userId = ctx.from.id;
    const now = Date.now();
    const userLimits = rateLimits.get(userId) || [];

    // Remove old entries
    const recentLimits = userLimits.filter(time => now - time < WINDOW);

    if (recentLimits.length >= RATE_LIMIT) {
      await ctx.reply('⚠️ Too many requests. Please slow down.');
      return;
    }

    recentLimits.push(now);
    rateLimits.set(userId, recentLimits);

    return next();
  });

  // Logging middleware
  bot.use(async (ctx, next) => {
    const start = Date.now();
    
    await next();
    
    const duration = Date.now() - start;
    logger.debug('Request processed', {
      userId: ctx.userId,
      updateType: ctx.updateType,
      duration,
    });
  });
};
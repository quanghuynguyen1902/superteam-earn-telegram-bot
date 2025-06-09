import { Telegraf } from 'telegraf';
import { BotContext } from './index';
import { UserModel } from '../db/models/user';
import { logger } from '../utils/logger';

export const setupMiddleware = (bot: Telegraf<BotContext>): void => {
  // User authentication middleware
  bot.use(async (ctx, next) => {
    logger.debug('Middleware triggered', { 
      from: ctx.from,
      updateType: ctx.updateType,
      message: (ctx.message as any)?.text 
    });

    if (!ctx.from) {
      return next();
    }

    try {
      const telegramId = ctx.from.id;
      logger.debug('Processing user', { telegramId });

      // Check if user exists
      let user = await UserModel.findByTelegramId(telegramId);
      logger.debug('User lookup result', { found: !!user, user });

      if (!user) {
        // Create new user
        logger.info('Creating new user', { telegramId });
        user = await UserModel.create(telegramId);
        logger.info('New user created', { telegramId, userId: user.id });
        
        // Mark that user needs to set geography
        ctx.state = { ...ctx.state, needsGeography: true };
      }

      // Attach user info to context
      ctx.userId = user.id;
      ctx.telegramId = telegramId;
      logger.debug('Context updated', { userId: ctx.userId, telegramId: ctx.telegramId });
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
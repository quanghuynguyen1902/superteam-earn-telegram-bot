import { Telegraf, Context } from 'telegraf';
import { config } from '../config';
import { logger } from '../utils/logger';
import { setupCommands } from './commands';
import { setupMiddleware } from './middleware';

export interface BotContext extends Context {
  userId?: string;
  telegramId?: number;
}

export const createBot = (): Telegraf<BotContext> => {
  const bot = new Telegraf<BotContext>(config.telegram.botToken);
  setupMiddleware(bot);
  setupCommands(bot);

  bot.catch((err: any, ctx: BotContext) => {
    logger.error('Bot error', { error: err, update: ctx.update });
    ctx.reply('An error occurred. Please try again later.').catch(() => {});
  });

  return bot;
};

export const launchBot = async (bot: Telegraf<BotContext>): Promise<void> => {
  await bot.launch();
  logger.info('Bot launched in polling mode');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

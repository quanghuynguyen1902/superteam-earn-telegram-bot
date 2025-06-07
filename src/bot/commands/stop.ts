import { Telegraf } from 'telegraf';
import { BotContext } from '../index';
import { UserModel } from '../../db/models/user';
import { logger } from '../../utils/logger';

export const setupStopCommand = (bot: Telegraf<BotContext>): void => {
  bot.command('stop', async (ctx) => {
    try {
      if (!ctx.telegramId) {
        await ctx.reply('Unable to identify user. Please try again.');
        return;
      }

      await UserModel.setActive(ctx.telegramId, false);

      await ctx.reply(
        '⏸️ *Notifications paused*\n\n' +
        'You will no longer receive notifications for new listings.\n\n' +
        'Use /start to resume notifications anytime.',
        { parse_mode: 'Markdown' }
      );

      logger.info('User stopped notifications', { telegramId: ctx.telegramId });
    } catch (error) {
      logger.error('Error in stop command', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });
};
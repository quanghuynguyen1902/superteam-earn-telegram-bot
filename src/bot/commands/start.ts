import { Telegraf } from 'telegraf';
import { BotContext } from '../index';
import { UserPreferencesModel } from '../../db/models/user';
import { logger } from '../../utils/logger';

export const setupStartCommand = (bot: Telegraf<BotContext>): void => {
  bot.command('start', async (ctx) => {
    try {
      const welcomeMessage = `
🚀 *Welcome to Superteam Earn Notification Bot!*

I'll help you stay updated with the latest bounties and projects on Superteam Earn that match your profile and preferences.

*Here's what I can do:*
• 📢 Notify you about new opportunities you're eligible for
• 💰 Filter notifications by USD value
• 🎯 Filter by bounties, projects, or both
• 🛠️ Filter by specific skills
• 🌍 Match opportunities based on your geography

*Quick Start:*
1. Use /preferences to set up your notification filters
2. Use /help to see all available commands
3. Sit back and receive personalized notifications!

_Notifications are sent 12 hours after a listing is published._
      `;

      await ctx.replyWithMarkdownV2(escapeMarkdown(welcomeMessage));

      // Create default preferences if they don't exist
      if (ctx.userId) {
        const preferences = await UserPreferencesModel.findByUserId(ctx.userId);
        if (!preferences) {
          await UserPreferencesModel.upsert(ctx.userId, {
            notify_bounties: true,
            notify_projects: true,
            skills: [],
          });
        }
      }

      logger.info('User started bot', { telegramId: ctx.from?.id });
    } catch (error) {
      logger.error('Error in start command', error);
      await ctx.reply('Welcome! An error occurred setting up your account. Please try again.');
    }
  });
};

const escapeMarkdown = (text: string): string => {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
};
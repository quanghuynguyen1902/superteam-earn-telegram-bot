import { Telegraf, Markup } from 'telegraf';
import { BotContext } from '../index';
import { UserModel, UserPreferencesModel } from '../../db/models/user';
import { logger } from '../../utils/logger';
import { Region } from '../../types';

export const setupStartCommand = (bot: Telegraf<BotContext>): void => {
  bot.command('start', async (ctx) => {
    try {
      // Check if user has geography set
      const telegramId = ctx.from?.id;
      if (telegramId) {
        const user = await UserModel.findByTelegramId(telegramId);
        
        if (user && !user.geography) {
          // User exists but hasn't set geography
          await showGeographySelection(ctx);
          return;
        }
      }

      const welcomeMessage = `
🚀 *Welcome to Superteam Earn Notification Bot\\!*

I'll help you stay updated with the latest bounties and projects on Superteam Earn that match your profile and preferences\\.

*Here's what I can do:*
• 📢 Notify you about new opportunities you're eligible for
• 💰 Filter notifications by USD value
• 🎯 Filter by bounties, projects, or both
• 🛠️ Filter by specific skills
• 🌍 Match opportunities based on your geography

*Quick Start:*
1\\. Use /preferences to set up your notification filters
2\\. Use /help to see all available commands
3\\. Sit back and receive personalized notifications\\!

*Notifications are sent 12 hours after a listing is published\\.*
      `;

      await ctx.replyWithMarkdownV2(welcomeMessage);

      // Create default preferences if they don't exist
      if (ctx.userId) {
        const preferences = await UserPreferencesModel.findByUserId(ctx.userId);
        if (!preferences) {
          await UserPreferencesModel.upsert(ctx.userId, {
            notifyBounties: true,
            notifyProjects: true,
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

  // Handle geography selection callbacks
  bot.action(/^geo_/, async (ctx) => {
    const region = (ctx.callbackQuery as any).data.replace('geo_', '');
    
    if (!ctx.telegramId) {
      await ctx.answerCbQuery('❌ User not found.');
      return;
    }

    try {
      await UserModel.updateGeography(ctx.telegramId, region);
      await ctx.editMessageText(`✅ Your region has been set to: ${region}\n\nYou'll now receive notifications for opportunities in ${region} and global listings.`);
      await ctx.answerCbQuery();
      
      // Show welcome message after geography is set
      const welcomeMessage = `
🎉 *Setup Complete\\!*

Your account is now ready\\. Here's how to get started:

*Available Commands:*
• /preferences \\- View and manage all settings
• /setusd \\- Set USD value filters
• /settype \\- Choose bounties, projects, or both
• /setskills \\- Set your skills
• /status \\- Check your settings and stats
• /help \\- Show all commands

You'll start receiving personalized notifications for new opportunities that match your profile\\!
      `;
      
      await ctx.replyWithMarkdownV2(welcomeMessage);
    } catch (error) {
      logger.error('Error setting geography', error);
      await ctx.answerCbQuery('❌ Failed to set region. Please try again.');
    }
  });
};

async function showGeographySelection(ctx: BotContext) {
  const regions = Object.values(Region);
  const buttons = [];
  
  // Create rows of 3 buttons each
  for (let i = 0; i < regions.length; i += 3) {
    const row = [];
    for (let j = 0; j < 3 && i + j < regions.length; j++) {
      const region = regions[i + j];
      row.push(Markup.button.callback(region, `geo_${region}`));
    }
    buttons.push(row);
  }

  const keyboard = Markup.inlineKeyboard(buttons);

  await ctx.reply(
    `🌍 *Welcome\\! Please select your region:*\n\nThis helps us show you relevant opportunities in your area plus all global listings\\.`,
    {
      parse_mode: 'MarkdownV2',
      ...keyboard
    }
  );
}

const escapeMarkdown = (text: string): string => {
  // Escape special characters for Telegram MarkdownV2
  return text
    .replace(/\\/g, '\\\\')
    .replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
};
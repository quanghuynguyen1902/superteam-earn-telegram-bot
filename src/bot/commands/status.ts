import { Telegraf } from 'telegraf';
import { BotContext } from '../index';
import { UserModel, UserPreferencesModel } from '../../db/models/user';
import { NotificationModel } from '../../db/models/notification';
import { logger } from '../../utils/logger';

export const setupStatusCommand = (bot: Telegraf<BotContext>): void => {
  bot.command('status', async (ctx) => {
    try {
      if (!ctx.userId) {
        await ctx.reply('❌ User not found.');
        return;
      }

      const user = await UserModel.findByTelegramId(ctx.telegramId!);
      const preferences = await UserPreferencesModel.findByUserId(ctx.userId);
      const notificationCount = await NotificationModel.getNotificationCount(ctx.userId);

      let message = '*📊 Your Status*\n\n';
      
      message += `*Account:*\n`;
      message += `• User ID: \`${ctx.userId}\`\n`;
      message += `• Telegram ID: \`${ctx.telegramId}\`\n`;
      message += `• Status: ${user?.is_active ? '✅ Active' : '❌ Inactive'}\n\n`;
      
      if (preferences) {
        message += `*Preferences:*\n`;
        message += `• Bounties: ${preferences.notify_bounties ? '✅' : '❌'}\n`;
        message += `• Projects: ${preferences.notify_projects ? '✅' : '❌'}\n`;
        
        if (preferences.min_usd_value || preferences.max_usd_value) {
          const min = preferences.min_usd_value ? `$${preferences.min_usd_value}` : 'No min';
          const max = preferences.max_usd_value ? `$${preferences.max_usd_value}` : 'No max';
          message += `• USD Range: ${min} - ${max}\n`;
        } else {
          message += `• USD Filter: None\n`;
        }
        
        if (preferences.skills && preferences.skills.length > 0) {
          message += `• Skills: ${preferences.skills.slice(0, 3).join(', ')}${preferences.skills.length > 3 ? '...' : ''}\n`;
        } else {
          message += `• Skills: All (no filter)\n`;
        }
      } else {
        message += `*Preferences:* Not set\n`;
      }
      
      message += `\n*Statistics:*\n`;
      message += `• Notifications received: ${notificationCount}\n`;
      
      message += `\n*Commands:*\n`;
      message += `• \`/preferences\` - Manage settings\n`;
      message += `• \`/help\` - Show help\n`;
      message += `• \`/stop\` - Pause notifications`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error in status command', error);
      await ctx.reply('❌ Failed to get status. Please try again.');
    }
  });
};
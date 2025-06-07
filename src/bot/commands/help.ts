import { Telegraf } from 'telegraf';
import { BotContext } from '../index';

export const setupHelpCommand = (bot: Telegraf<BotContext>): void => {
  bot.command('help', async (ctx) => {
    const helpMessage = `
📚 *Available Commands:*

*Basic Commands:*
/start - Start the bot and see welcome message
/help - Show this help message
/status - Check your notification settings and stats
/stop - Pause notifications

*Preference Management:*
/preferences - View and manage all preferences
/setusd - Set USD value filter (min and max)
/settype - Choose notification types (bounties/projects)
/setskills - Select skills to filter by
/setgeo - Set your geography

*Examples:*
• \`/setusd 100 5000\` - Get notified for listings between $100-$5000
• \`/settype bounties\` - Only get bounty notifications
• \`/setskills\` - Opens skill selection menu

*Tips:*
• Notifications are sent 12 hours after listing publication
• You'll only receive notifications for listings you're eligible for
• All listing links include tracking for analytics

Need support? Contact @superteam_support
    `;

    await ctx.replyWithMarkdownV2(escapeMarkdown(helpMessage));
  });
};

const escapeMarkdown = (text: string): string => {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
};
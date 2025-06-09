import { Telegraf, Markup } from 'telegraf';
import { BotContext } from '../index';
import { UserModel, UserPreferencesModel } from '../../db/models/user';
import { logger } from '../../utils/logger';
import { Region } from '../../types';

export const setupPreferencesCommands = (bot: Telegraf<BotContext>): void => {
  // Main preferences command
  bot.command('preferences', async (ctx) => {
    await showPreferencesMenu(ctx);
  });

  // USD value filter
  bot.command('setusd', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length === 0) {
      await ctx.reply(
        '*Set USD Value Filter*\n\n' +
        'Usage: `/setusd [min] [max]`\n\n' +
        'Examples:\n' +
        '• `/setusd 100` - minimum $100\n' +
        '• `/setusd 100 1000` - between $100-$1000\n' +
        '• `/setusd 0` - remove filters',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const minValue = parseFloat(args[0]);
    const maxValue = args[1] ? parseFloat(args[1]) : undefined;

    if (isNaN(minValue) || (maxValue !== undefined && isNaN(maxValue))) {
      await ctx.reply('❌ Please provide valid numbers for USD values.');
      return;
    }

    try {
      if (!ctx.userId) {
        await ctx.reply('❌ User not found.');
        return;
      }

      const currentPrefs = await UserPreferencesModel.findByUserId(ctx.userId);
      await UserPreferencesModel.upsert(ctx.userId, {
        ...currentPrefs,
        minUsdValue: minValue === 0 ? undefined : minValue,
        maxUsdValue: maxValue === 0 ? undefined : maxValue,
      });

      if (minValue === 0) {
        await ctx.reply('✅ USD filters removed. You\'ll receive notifications for all reward amounts.');
      } else if (maxValue) {
        await ctx.reply(`✅ USD filter set: $${minValue} - $${maxValue}`);
      } else {
        await ctx.reply(`✅ Minimum USD filter set: $${minValue}`);
      }
    } catch (error) {
      logger.error('Error setting USD filter', error);
      await ctx.reply('❌ Failed to update USD filter. Please try again.');
    }
  });

  // Set listing types
  bot.command('settype', async (ctx) => {
    if (!ctx.userId) {
      await ctx.reply('❌ User not found.');
      return;
    }

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Bounties Only', 'type_bounties'),
        Markup.button.callback('Projects Only', 'type_projects')
      ],
      [Markup.button.callback('Both', 'type_both')],
      [Markup.button.callback('❌ Cancel', 'cancel')]
    ]);

    await ctx.reply('*Choose Notification Types*\n\nWhat types of opportunities would you like to be notified about?', {
      parse_mode: 'Markdown',
      ...keyboard
    });
  });

  // Skills selection (simplified)
  bot.command('setskills', async (ctx) => {
    await ctx.reply(
      '*Skills Configuration*\n\n' +
      'Send me a list of skills you\'re interested in, separated by commas.\n\n' +
      'Example: `React, TypeScript, Node.js, Solidity`\n\n' +
      'Or send "none" to receive notifications for all skills.',
      { parse_mode: 'Markdown' }
    );
  });

  // Geography setting
  bot.command('setgeo', async (ctx) => {
    if (!ctx.telegramId) {
      await ctx.reply('❌ User not found.');
      return;
    }

    const regions = Object.values(Region);
    const buttons = [];
    
    // Create rows of 3 buttons each
    for (let i = 0; i < regions.length; i += 3) {
      const row = [];
      for (let j = 0; j < 3 && i + j < regions.length; j++) {
        const region = regions[i + j];
        row.push(Markup.button.callback(region, `setgeo_${region}`));
      }
      buttons.push(row);
    }

    const keyboard = Markup.inlineKeyboard(buttons);

    await ctx.reply(
      `🌍 *Select Your Region:*\n\nChoose your region to receive relevant local opportunities plus all global listings.`,
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );
  });

  // Handle setgeo callbacks
  bot.action(/^setgeo_/, async (ctx) => {
    const region = (ctx.callbackQuery as any).data.replace('setgeo_', '');
    
    if (!ctx.telegramId) {
      await ctx.answerCbQuery('❌ User not found.');
      return;
    }

    try {
      await UserModel.updateGeography(ctx.telegramId, region);
      await ctx.editMessageText(`✅ Your region has been updated to: ${region}\n\nYou'll now receive notifications for opportunities in ${region} and global listings.`);
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error updating geography', error);
      await ctx.answerCbQuery('❌ Failed to update region. Please try again.');
    }
  });

  // Handle callback queries
  bot.action(/^type_/, async (ctx) => {
    if (!ctx.userId) {
      await ctx.answerCbQuery('❌ User not found.');
      return;
    }

    const action = (ctx.callbackQuery as any).data;
    let notifyBounties = true;
    let notifyProjects = true;

    switch (action) {
      case 'type_bounties':
        notifyBounties = true;
        notifyProjects = false;
        break;
      case 'type_projects':
        notifyBounties = false;
        notifyProjects = true;
        break;
      case 'type_both':
        notifyBounties = true;
        notifyProjects = true;
        break;
    }

    try {
      const currentPrefs = await UserPreferencesModel.findByUserId(ctx.userId);
      await UserPreferencesModel.upsert(ctx.userId, {
        ...currentPrefs,
        notifyBounties: notifyBounties,
        notifyProjects: notifyProjects,
      });

      let message = '✅ Notification types updated:\n\n';
      if (notifyBounties && notifyProjects) {
        message += '• Bounties: ✅\n• Projects: ✅';
      } else if (notifyBounties) {
        message += '• Bounties: ✅\n• Projects: ❌';
      } else {
        message += '• Bounties: ❌\n• Projects: ✅';
      }

      await ctx.editMessageText(message);
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error updating notification types', error);
      await ctx.answerCbQuery('❌ Failed to update notification types.');
    }
  });

  // Handle skills input
  bot.on('text', async (ctx, next) => {
    // Check if this is a skills configuration message
    const text = ctx.message.text.toLowerCase().trim();
    
    if (text === 'none') {
      try {
        if (!ctx.userId) {
          await ctx.reply('❌ User not found.');
          return;
        }

        const currentPrefs = await UserPreferencesModel.findByUserId(ctx.userId);
        await UserPreferencesModel.upsert(ctx.userId, {
          ...currentPrefs,
          skills: [],
        });

        await ctx.reply('✅ Skills filter removed. You\'ll receive notifications for all opportunities.');
      } catch (error) {
        logger.error('Error clearing skills', error);
        await ctx.reply('❌ Failed to update skills. Please try again.');
      }
      return;
    }

    // Check if this looks like a skills list (contains commas)
    if (text.includes(',')) {
      try {
        if (!ctx.userId) {
          await ctx.reply('❌ User not found.');
          return;
        }

        const skills = text.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        const currentPrefs = await UserPreferencesModel.findByUserId(ctx.userId);
        await UserPreferencesModel.upsert(ctx.userId, {
          ...currentPrefs,
          skills: skills,
        });

        await ctx.reply(`✅ Skills updated:\n\n${skills.map(s => `• ${s}`).join('\n')}`);
      } catch (error) {
        logger.error('Error updating skills', error);
        await ctx.reply('❌ Failed to update skills. Please try again.');
      }
      return;
    }

    // Continue to other handlers
    return next();
  });

  bot.action('cancel', async (ctx) => {
    await ctx.editMessageText('❌ Cancelled');
    await ctx.answerCbQuery();
  });
};

async function showPreferencesMenu(ctx: BotContext) {
  try {
    if (!ctx.userId || !ctx.telegramId) {
      await ctx.reply('❌ User not found.');
      return;
    }

    const user = await UserModel.findByTelegramId(ctx.telegramId);
    const preferences = await UserPreferencesModel.findByUserId(ctx.userId);
    
    let message = '*🔧 Notification Preferences*\n\n';
    
    // Show geography
    message += `*Geography:*\n`;
    message += `• Region: ${user?.geography || 'Not set'}\n\n`;
    
    if (preferences) {
      message += `*Types:*\n`;
      message += `• Bounties: ${preferences.notifyBounties ? '✅' : '❌'}\n`;
      message += `• Projects: ${preferences.notifyProjects ? '✅' : '❌'}\n\n`;
      
      message += `*USD Filter:*\n`;
      if (preferences.minUsdValue || preferences.maxUsdValue) {
        const min = preferences.minUsdValue ? `$${preferences.minUsdValue}` : 'No min';
        const max = preferences.maxUsdValue ? `$${preferences.maxUsdValue}` : 'No max';
        message += `• Range: ${min} - ${max}\n\n`;
      } else {
        message += `• No USD filters set\n\n`;
      }
      
      message += `*Skills:*\n`;
      if (preferences.skills && preferences.skills.length > 0) {
        message += `• ${preferences.skills.join(', ')}\n\n`;
      } else {
        message += `• All skills (no filter)\n\n`;
      }
    } else {
      message += 'No preferences set yet.\n\n';
    }
    
    message += '*Available Commands:*\n';
    message += '• `/setusd` - Set USD value filter\n';
    message += '• `/settype` - Choose bounties/projects\n';
    message += '• `/setskills` - Set skills filter\n';
    message += '• `/setgeo` - Change geography\n';

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Error showing preferences menu', error);
    await ctx.reply('❌ Failed to load preferences. Please try again.');
  }
}
import { Telegraf } from 'telegraf';
import { BotContext } from '../bot';
import { Listing } from '../types';
import { NotificationFormatterService } from './notification-formatter';
import { logger } from '../utils/logger';

export class NotificationSenderService {
  private bot: Telegraf<BotContext>;
  private formatter: NotificationFormatterService;

  constructor(bot: Telegraf<BotContext>) {
    this.bot = bot;
    this.formatter = new NotificationFormatterService();
  }

  async sendNotification(
    telegramId: number,
    listing: Listing
  ): Promise<boolean> {
    try {
      const message = this.formatter.formatNotification(listing);
      
      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        link_preview_options: { is_disabled: false },
      });

      logger.info(`Notification sent to user ${telegramId} for listing ${listing.id}`);
      return true;
    } catch (error: any) {
      if (error.code === 403) {
        // User has blocked the bot
        logger.warn(`User ${telegramId} has blocked the bot`);
        // TODO: Mark user as inactive
      } else {
        logger.error(`Failed to send notification to user ${telegramId}`, error);
      }
      return false;
    }
  }

  async sendBatchSummary(
    telegramId: number,
    count: number
  ): Promise<boolean> {
    try {
      const message = this.formatter.formatBatchSummary(count);
      
      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
      });

      return true;
    } catch (error) {
      logger.error(`Failed to send batch summary to user ${telegramId}`, error);
      return false;
    }
  }

  async sendErrorNotification(
    telegramId: number
  ): Promise<boolean> {
    try {
      const message = this.formatter.formatErrorMessage();
      
      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
      });

      return true;
    } catch (error) {
      logger.error(`Failed to send error notification to user ${telegramId}`, error);
      return false;
    }
  }

  // Send a test notification
  async sendTestNotification(
    telegramId: number
  ): Promise<boolean> {
    try {
      const testListing: Listing = {
        id: 'test-123',
        title: 'Test Notification - Build a DeFi Dashboard',
        sponsor_name: 'Superteam',
        type: 'bounty',
        reward_token: 'USDC',
        reward_amount: 1000,
        reward_usd_value: 1000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        geography: ['Global'],
        required_skills: ['React', 'TypeScript'],
        url: 'https://earn.superteam.fun/listings/test',
        published_at: new Date(),
        created_at: new Date(),
      };

      const message = this.formatter.formatNotification(testListing);
      
      await this.bot.telegram.sendMessage(
        telegramId,
        '🧪 *Test Notification*\n\n' + message,
        {
          parse_mode: 'Markdown',
          link_preview_options: { is_disabled: false },
        }
      );

      logger.info(`Test notification sent to user ${telegramId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send test notification to user ${telegramId}`, error);
      return false;
    }
  }

  // Batch send notifications (more efficient for multiple users)
  async batchSendNotifications(
    notifications: Array<{ telegramId: number; listing: Listing }>
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    // Process in chunks to respect rate limits
    const chunkSize = 30; // Telegram allows 30 messages per second
    
    for (let i = 0; i < notifications.length; i += chunkSize) {
      const chunk = notifications.slice(i, i + chunkSize);
      
      const results = await Promise.allSettled(
        chunk.map(({ telegramId, listing }) =>
          this.sendNotification(telegramId, listing)
        )
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          successful++;
        } else {
          failed++;
        }
      });

      // Wait 1 second between chunks to respect rate limits
      if (i + chunkSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { successful, failed };
  }
}
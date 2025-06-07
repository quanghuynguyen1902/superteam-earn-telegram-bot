import * as cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { BotContext } from '../bot';
import { config } from '../config';
import { logger } from '../utils/logger';
import { EarnDatabaseService } from './earn-db';
import { NotificationFilterService } from './notification-filter';
import { NotificationSenderService } from './notification-sender';

import { botDb } from '../db';

export class NotificationScheduler {
  private earnDb: EarnDatabaseService;
  private filterService: NotificationFilterService;
  private senderService: NotificationSenderService;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(bot: Telegraf<BotContext>) {
    this.earnDb = new EarnDatabaseService();
    this.filterService = new NotificationFilterService();
    this.senderService = new NotificationSenderService(bot);
  }

  start(): void {
    // Run every 5 minutes to check for listings that need notifications
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      await this.checkAndSendNotifications();
    });

    logger.info('Notification scheduler started');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Notification scheduler stopped');
    }
  }

  async checkAndSendNotifications(): Promise<void> {
    try {
      logger.info('Checking for listings to notify...');

      // Get bounties published N hours ago
      const bounties = await this.earnDb.getListingsForNotification(
        config.notifications.delayHours
      );

      // Get grants (they don't have a delay typically)
      const grants = await this.earnDb.getGrantsForNotification();

      const allListings = [...bounties, ...grants];

      if (allListings.length === 0) {
        logger.info('No listings found for notification');
        return;
      }

      logger.info(`Found ${allListings.length} listings for notification (${bounties.length} bounties, ${grants.length} grants)`);

      let totalNotificationsSent = 0;
      let totalNotificationsFailed = 0;

      // Process each listing
      for (const listing of allListings) {
        const result = await this.processListingNotifications(listing);
        totalNotificationsSent += result.sent;
        totalNotificationsFailed += result.failed;

        // Rate limiting between listings
        await this.delay(1000);
      }

      logger.info(`Notification run completed. Sent: ${totalNotificationsSent}, Failed: ${totalNotificationsFailed}`);
    } catch (error) {
      logger.error('Error in notification scheduler', error);
    }
  }

  private async processListingNotifications(
    earnListing: any
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    try {
      // Transform the listing based on its type
      const listing = earnListing.type === 'grant' 
        ? this.earnDb.transformGrantToListing(earnListing)
        : this.earnDb.transformBountyToListing(earnListing);

      // Get eligible users for this listing
      const eligibleUsers = await this.filterService.getEligibleUsers(listing);

      if (eligibleUsers.length === 0) {
        logger.debug(`No eligible users for listing ${listing.id}`);
        return { sent, failed };
      }

      logger.info(`Processing listing ${listing.id} for ${eligibleUsers.length} eligible users`);

      // Send notifications to eligible users
      for (const user of eligibleUsers) {
        try {
          // Send the notification
          const success = await this.senderService.sendNotification(
            parseInt(user.telegramId),
            listing
          );

          if (success) {
            // Record successful notification
            await this.filterService.recordNotification(user.id, listing.id);
            sent++;
            logger.debug(`Notification sent to user ${user.telegramId} for listing ${listing.id}`);
          } else {
            failed++;
          }

          // Rate limiting between notifications
          await this.delay(1000 / (config.notifications.rateLimitPerSecond || 10));
        } catch (error) {
          logger.error(`Failed to send notification for listing ${listing.id} to user ${user.telegramId}`, error);
          failed++;
        }
      }
    } catch (error) {
      logger.error(`Error processing listing notifications`, error);
      failed++;
    }

    return { sent, failed };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual trigger for testing
  async triggerNotificationsForListing(listingId: string): Promise<void> {
    try {
      // Try to find as bounty first
      let earnListing = await this.earnDb.getListingsForNotification(0).then(listings => 
        listings.find(l => l.id === listingId)
      );

      // If not found as bounty, try grants
      if (!earnListing) {
        const grants = await this.earnDb.getGrantsForNotification();
        earnListing = grants.find(g => g.id === listingId);
      }

      if (!earnListing) {
        throw new Error(`Listing ${listingId} not found`);
      }

      // Process the listing
      const result = await this.processListingNotifications(earnListing);

      logger.info(`Manual notification trigger completed for listing ${listingId}. Sent: ${result.sent}, Failed: ${result.failed}`);
    } catch (error) {
      logger.error('Error in manual notification trigger', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalNotifications: number;
    notificationsToday: number;
  }> {
    try {
      const totalUsers = await botDb.user.count();
      const activeUsers = await botDb.user.count({
        where: { isActive: true }
      });

      const totalNotifications = await botDb.notificationLog.count();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const notificationsToday = await botDb.notificationLog.count({
        where: {
          sentAt: {
            gte: today
          }
        }
      });

      return {
        totalUsers,
        activeUsers,
        totalNotifications,
        notificationsToday
      };
    } catch (error) {
      logger.error('Error getting notification stats', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalNotifications: 0,
        notificationsToday: 0
      };
    }
  }

  async cleanup(): Promise<void> {
    this.stop();
    // Services will clean up their own connections
  }
}
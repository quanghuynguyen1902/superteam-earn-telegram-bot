import { botDb } from '../index';
import { Notification } from '../../types';

export class NotificationModel {
  static async create(
    userId: string,
    listingId: string
  ): Promise<{ id: string } | null> {
    try {
      const result = await botDb.notificationLog.create({
        data: {
          userId,
          listingId
        }
      });
      return { id: result.id };
    } catch (error: any) {
      // Handle duplicate key constraint (user already notified about this listing)
      if (error.code === 'P2002') {
        return null;
      }
      throw error;
    }
  }

  static async hasUserBeenNotified(
    userId: string,
    listingId: string
  ): Promise<boolean> {
    const count = await botDb.notificationLog.count({
      where: {
        userId,
        listingId
      }
    });
    return count > 0;
  }

  static async getNotificationCount(userId: string): Promise<number> {
    return botDb.notificationLog.count({
      where: { userId }
    });
  }

  static async getRecentNotifications(
    userId: string,
    limit: number = 10
  ): Promise<Notification[]> {
    return botDb.notificationLog.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: limit
    });
  }
}
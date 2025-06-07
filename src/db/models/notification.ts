import { query } from '../index';
import { Notification } from '../../types';

export class NotificationModel {
  static async create(
    userId: string,
    listingId: string
  ): Promise<{ id: string } | null> {
    try {
      const [result] = await query<{ id: string }>(
        `INSERT INTO notification_log (user_id, listing_id, sent_at)
         VALUES ($1, $2, NOW())
         RETURNING id`,
        [userId, listingId]
      );
      return result || null;
    } catch (error: any) {
      // Handle duplicate key constraint (user already notified about this listing)
      if (error.code === '23505') {
        return null;
      }
      throw error;
    }
  }

  static async hasUserBeenNotified(
    userId: string,
    listingId: string
  ): Promise<boolean> {
    const [result] = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM notification_log WHERE user_id = $1 AND listing_id = $2',
      [userId, listingId]
    );
    return parseInt(result?.count || '0') > 0;
  }

  static async getNotificationCount(userId: string): Promise<number> {
    const [result] = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM notification_log WHERE user_id = $1',
      [userId]
    );
    return parseInt(result?.count || '0');
  }

  static async getRecentNotifications(
    userId: string,
    limit: number = 10
  ): Promise<Notification[]> {
    return query<Notification>(
      `SELECT * FROM notification_log 
       WHERE user_id = $1 
       ORDER BY sent_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
  }
}
import { query } from '../index';
import { User, UserPreferences } from '../../types';

export class UserModel {
  static async create(telegramId: number): Promise<User> {
    const [user] = await query<User>(
      `INSERT INTO users (telegram_id) 
       VALUES ($1) 
       ON CONFLICT (telegram_id) 
       DO UPDATE SET is_active = true, updated_at = NOW()
       RETURNING *`,
      [telegramId]
    );
    return user;
  }

  static async findByTelegramId(telegramId: number): Promise<User | null> {
    const [user] = await query<User>(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return user || null;
  }

  static async updateEarnUserId(telegramId: number, earnUserId: string): Promise<User | null> {
    const [user] = await query<User>(
      'UPDATE users SET earn_user_id = $1, updated_at = NOW() WHERE telegram_id = $2 RETURNING *',
      [earnUserId, telegramId]
    );
    return user || null;
  }

  static async updateGeography(telegramId: number, geography: string): Promise<User | null> {
    const [user] = await query<User>(
      'UPDATE users SET geography = $1, updated_at = NOW() WHERE telegram_id = $2 RETURNING *',
      [geography, telegramId]
    );
    return user || null;
  }

  static async setActive(telegramId: number, isActive: boolean): Promise<void> {
    await query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE telegram_id = $2',
      [isActive, telegramId]
    );
  }

  static async getAllActive(): Promise<User[]> {
    return query<User>(
      'SELECT * FROM users WHERE is_active = true'
    );
  }
}

export class UserPreferencesModel {
  static async upsert(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const {
      min_usd_value,
      max_usd_value,
      notify_bounties = true,
      notify_projects = true,
      skills = []
    } = preferences;

    const [result] = await query<UserPreferences>(
      `INSERT INTO user_preferences 
       (user_id, min_usd_value, max_usd_value, notify_bounties, notify_projects, skills)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id)
       DO UPDATE SET 
         min_usd_value = EXCLUDED.min_usd_value,
         max_usd_value = EXCLUDED.max_usd_value,
         notify_bounties = EXCLUDED.notify_bounties,
         notify_projects = EXCLUDED.notify_projects,
         skills = EXCLUDED.skills,
         updated_at = NOW()
       RETURNING *`,
      [userId, min_usd_value, max_usd_value, notify_bounties, notify_projects, skills]
    );
    return result;
  }

  static async findByUserId(userId: string): Promise<UserPreferences | null> {
    const [preferences] = await query<UserPreferences>(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    return preferences || null;
  }
}
import { botDb } from '../index';
import { User, UserPreferences } from '../../types';
import { logger } from '../../utils/logger';

export class UserModel {
  static async create(telegramId: number): Promise<User> {
    try {
      const user = await botDb.user.upsert({
        where: { telegramId: telegramId.toString() },
        update: { isActive: true },
        create: { telegramId: telegramId.toString() }
      });
      logger.info('User created in database', { user });
      return user;
    } catch (error) {
      logger.error('Failed to create user in database', { telegramId, error });
      throw error;
    }
  }

  static async findByTelegramId(telegramId: number): Promise<User | null> {
    const user = await botDb.user.findUnique({
      where: { telegramId: telegramId.toString() },
      include: { preferences: true }
    });
    return user;
  }

  static async updateEarnUserId(telegramId: number, earnUserId: string): Promise<User | null> {
    const user = await botDb.user.update({
      where: { telegramId: telegramId.toString() },
      data: { earnUserId }
    });
    return user;
  }

  static async updateGeography(telegramId: number, geography: string): Promise<User | null> {
    const user = await botDb.user.update({
      where: { telegramId: telegramId.toString() },
      data: { geography }
    });
    return user;
  }

  static async setActive(telegramId: number, isActive: boolean): Promise<void> {
    await botDb.user.update({
      where: { telegramId: telegramId.toString() },
      data: { isActive }
    });
  }

  static async getAllActive(): Promise<User[]> {
    return botDb.user.findMany({
      where: { isActive: true },
      include: { preferences: true }
    });
  }
}

export class UserPreferencesModel {
  static async upsert(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const {
      minUsdValue,
      maxUsdValue,
      notifyBounties = true,
      notifyProjects = true,
      skills = []
    } = preferences;

    const result = await botDb.userPreferences.upsert({
      where: { userId },
      update: {
        minUsdValue,
        maxUsdValue,
        notifyBounties,
        notifyProjects,
        skills
      },
      create: {
        userId,
        minUsdValue,
        maxUsdValue,
        notifyBounties,
        notifyProjects,
        skills
      }
    });
    return result;
  }

  static async findByUserId(userId: string): Promise<UserPreferences | null> {
    const preferences = await botDb.userPreferences.findUnique({
      where: { userId }
    });
    return preferences;
  }
}
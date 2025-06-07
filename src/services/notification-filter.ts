import { botDb } from '../db';
import { Listing } from '../types';
import { logger } from '../utils/logger';
import { EarnDatabaseService } from './earn-db';

export class NotificationFilterService {
  private earnDb: EarnDatabaseService;

  constructor() {
    this.earnDb = new EarnDatabaseService();
  }

  // Get users who should receive notifications for a listing
  async getEligibleUsers(listing: Listing): Promise<any[]> {
    try {
      // Get all active bot users with their preferences
      const users = await botDb.user.findMany({
        where: {
          isActive: true,
        },
        include: {
          preferences: true,
        },
      });

      const eligibleUsers = [];

      for (const user of users) {
        if (user.preferences && await this.shouldNotifyUser(user, user.preferences, listing)) {
          eligibleUsers.push(user);
        }
      }

      return eligibleUsers;
    } catch (error) {
      logger.error('Failed to get eligible users', error);
      return [];
    }
  }

  // Check if a user has already been notified about a listing
  async hasBeenNotified(userId: string, listingId: string): Promise<boolean> {
    try {
      const existingLog = await botDb.notificationLog.findUnique({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
      });

      return !!existingLog;
    } catch (error) {
      logger.error('Failed to check notification log', error);
      return false; // Err on the side of sending notification
    }
  }

  // Record that a user has been notified about a listing
  async recordNotification(userId: string, listingId: string): Promise<void> {
    try {
      await botDb.notificationLog.create({
        data: {
          userId,
          listingId,
        },
      });
    } catch (error) {
      logger.error('Failed to record notification', error);
    }
  }

  private async shouldNotifyUser(
    user: any,
    preferences: any,
    listing: Listing
  ): Promise<boolean> {
    // Check if already notified
    if (await this.hasBeenNotified(user.id, listing.id)) {
      logger.debug(`User ${user.telegramId} already notified about ${listing.id}`);
      return false;
    }

    // Check listing type preference
    if (!this.matchesListingType(preferences, listing)) {
      logger.debug(`Listing ${listing.id} filtered out: type mismatch for user ${user.telegramId}`);
      return false;
    }

    // Check USD value filter
    if (!this.matchesUsdFilter(preferences, listing)) {
      logger.debug(`Listing ${listing.id} filtered out: USD value mismatch for user ${user.telegramId}`);
      return false;
    }

    // Check skills filter
    if (!this.matchesSkillsFilter(preferences, listing)) {
      logger.debug(`Listing ${listing.id} filtered out: skills mismatch for user ${user.telegramId}`);
      return false;
    }

    // Check geography eligibility
    if (!this.matchesGeography(user, listing)) {
      logger.debug(`Listing ${listing.id} filtered out: geography mismatch for user ${user.telegramId}`);
      return false;
    }

    // Check user eligibility on Earn platform
    if (user.earnUserId) {
      const isEligible = await this.earnDb.checkUserEligibility(
        user.earnUserId,
        listing.id
      );
      
      if (!isEligible) {
        logger.debug(`Listing ${listing.id} filtered out: user not eligible on Earn platform`);
        return false;
      }
    }

    return true;
  }

  private matchesListingType(preferences: any, listing: Listing): boolean {
    if (listing.type === 'bounty' && !preferences.notifyBounties) {
      return false;
    }
    if (listing.type === 'project' && !preferences.notifyProjects) {
      return false;
    }
    if (listing.type === 'grant') {
      // For grants, check if either bounties or projects is enabled
      return preferences.notifyBounties || preferences.notifyProjects;
    }
    return true;
  }

  private matchesUsdFilter(preferences: any, listing: Listing): boolean {
    // Get the effective USD value for comparison
    let effectiveValue: number;
    
    if (listing.is_variable_comp || listing.min_reward_usd !== undefined) {
      // For variable or range compensation, use the minimum value
      effectiveValue = listing.min_reward_usd || 0;
    } else {
      // For fixed compensation
      effectiveValue = listing.reward_usd_value || 0;
    }

    // Check minimum USD filter
    if (preferences.minUsdValue !== null && 
        preferences.minUsdValue !== undefined &&
        effectiveValue < preferences.minUsdValue) {
      return false;
    }

    // Check maximum USD filter (use max_reward_usd if available)
    if (preferences.maxUsdValue !== null && 
        preferences.maxUsdValue !== undefined) {
      const maxValue = listing.max_reward_usd || effectiveValue;
      if (maxValue > preferences.maxUsdValue) {
        return false;
      }
    }

    return true;
  }

  private matchesSkillsFilter(preferences: any, listing: Listing): boolean {
    // If no skills filter is set, match all listings
    if (!preferences.skills || preferences.skills.length === 0) {
      return true;
    }

    // If listing has no required skills, it matches (open to all skills)
    if (!listing.required_skills || listing.required_skills.length === 0) {
      return true;
    }

    // Check for skill matches (case-insensitive, partial matching)
    const userSkillsLower = preferences.skills.map((s: string) => s.toLowerCase().trim());
    const listingSkillsLower = listing.required_skills.map(s => s.toLowerCase().trim());

    return userSkillsLower.some((userSkill: string) => 
      listingSkillsLower.some(listingSkill => 
        listingSkill.includes(userSkill) || userSkill.includes(listingSkill)
      )
    );
  }

  private matchesGeography(user: any, listing: Listing): boolean {
    // If listing has no geography restrictions, it's global
    if (!listing.geography || listing.geography.length === 0) {
      return true;
    }

    // Check if listing is explicitly global
    if (listing.geography.includes('GLOBAL') || 
        listing.geography.includes('Global') || 
        listing.geography.includes('global') ||
        listing.geography.includes('Worldwide')) {
      return true;
    }

    // If user has no geography set, they can only see global opportunities
    if (!user.geography) {
      return false;
    }

    // Check if user's geography matches any of the listing's geographies
    const userGeoLower = user.geography.toLowerCase();
    return listing.geography.some(geo => 
      geo.toLowerCase() === userGeoLower ||
      geo.toLowerCase().includes(userGeoLower) ||
      userGeoLower.includes(geo.toLowerCase())
    );
  }
}
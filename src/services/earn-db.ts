import { earnDb } from '../db';
import { logger } from '../utils/logger';
import { Listing } from '../types';

// Service for interacting with the Earn database (read-only)
export class EarnDatabaseService {
  // Get available skills from Earn database for user selection
  async getAvailableSkills(): Promise<string[]> {
    try {
      const bounties = await earnDb.bounties.findMany({
        select: {
          skills: true,
        },
        where: {
          skills: {
            not: null,
          },
          isPublished: true,
          isActive: true,
        },
      });

      const skillSet = new Set<string>();

      bounties.forEach((bounty: { skills: any }) => {
        const skills = bounty.skills as any;
        if (Array.isArray(skills)) {
          skills.forEach((skill) => {
            if (typeof skill === "string") {
              skillSet.add(skill);
            }
          });
        }
      });

      return Array.from(skillSet).sort();
    } catch (error) {
      logger.error('Failed to fetch available skills', error);
      return [];
    }
  }

  // Get listings published in the last N hours
  async getRecentListings(hoursAgo: number): Promise<any[]> {
    const since = new Date();
    since.setHours(since.getHours() - hoursAgo);

    try {
      const bounties = await earnDb.bounties.findMany({
        where: {
          publishedAt: {
            gte: since,
          },
          status: 'OPEN',
          isPublished: true,
          isActive: true,
        },
        include: {
          sponsor: true,
          poc: true,
        },
      });

      return bounties;
    } catch (error) {
      logger.error('Failed to fetch recent listings from Earn DB', error);
      throw error;
    }
  }

  // Get listings ready for notification (published exactly N hours ago)
  async getListingsForNotification(delayHours: number): Promise<any[]> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - delayHours);
    startTime.setMinutes(startTime.getMinutes() - 5); // 5-minute window before

    const endTime = new Date();
    endTime.setHours(endTime.getHours() - delayHours);
    endTime.setMinutes(endTime.getMinutes() + 5); // 5-minute window after

    try {
      const bounties = await earnDb.bounties.findMany({
        where: {
          publishedAt: {
            gte: startTime,
            lte: endTime,
          },
          status: 'OPEN',
          isPublished: true,
          isActive: true,
        },
        include: {
          sponsor: true,
          poc: true,
        },
      });

      return bounties;
    } catch (error) {
      logger.error('Failed to fetch listings for notification', error);
      throw error;
    }
  }

  // Get grants for notification
  async getGrantsForNotification(): Promise<any[]> {
    try {
      const grants = await earnDb.grants.findMany({
        where: {
          status: 'OPEN',
          isPublished: true,
          isActive: true,
        },
        include: {
          sponsor: true,
          poc: true,
        },
      });

      return grants;
    } catch (error) {
      logger.error('Failed to fetch grants', error);
      return [];
    }
  }

  // Check if user is eligible for a listing
  async checkUserEligibility(
    earnUserId: string,
    listingId: string
  ): Promise<boolean> {
    try {
      const [user, bounty] = await Promise.all([
        earnDb.user.findUnique({ where: { id: earnUserId } }),
        earnDb.bounties.findUnique({ where: { id: listingId } }),
      ]);

      if (!user || !bounty) {
        return false;
      }

      // Check eligibility criteria
      const eligibility = bounty.eligibility as any;

      // Check location eligibility
      if (eligibility?.regions && user.location) {
        const allowedRegions = Array.isArray(eligibility.regions)
          ? eligibility.regions
          : [eligibility.regions];

        if (!allowedRegions.includes('GLOBAL') &&
            !allowedRegions.includes(user.location)) {
          return false;
        }
      }

      // Check if user has already submitted
      const existingSubmission = await earnDb.submission.findFirst({
        where: {
          userId: earnUserId,
          listingId: listingId,
        },
      });

      if (existingSubmission) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to check user eligibility', error);
      return true; // Default to true if check fails
    }
  }

  // Get user by email (for linking bot users with earn users)
  async getUserByEmail(email: string): Promise<any | null> {
    try {
      return await earnDb.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          location: true,
          skills: true,
        },
      });
    } catch (error) {
      logger.error('Failed to get user by email', error);
      return null;
    }
  }

  // Transform Earn bounty to our Listing format
  transformBountyToListing(bounty: any): Listing {
    // Determine reward amount and USD value
    let rewardUsdValue = bounty.usdValue || bounty.rewardAmount || 0;
    let isVariableComp = bounty.compensationType === 'variable';
    let minRewardUsd = bounty.minRewardAsk;
    let maxRewardUsd = bounty.maxRewardAsk;

    if (bounty.compensationType === 'range') {
      minRewardUsd = bounty.minRewardAsk;
      maxRewardUsd = bounty.maxRewardAsk;
      rewardUsdValue = minRewardUsd || 0;
    }

    // Extract geography/location
    let geography: string[] = [bounty.region || 'GLOBAL'];

    // Extract skills
    let requiredSkills: string[] = [];
    if (bounty.skills) {
      if (Array.isArray(bounty.skills)) {
        requiredSkills = bounty.skills;
      }
    }

    return {
      id: bounty.id,
      title: bounty.title || 'Untitled',
      sponsor_name: bounty.sponsor?.name || 'Unknown Sponsor',
      type: bounty.type === 'project' ? 'project' : 'bounty',
      reward_token: bounty.token || 'USDC',
      reward_amount: bounty.rewardAmount,
      reward_usd_value: rewardUsdValue,
      is_variable_comp: isVariableComp,
      min_reward_usd: minRewardUsd,
      max_reward_usd: maxRewardUsd,
      deadline: bounty.deadline ? new Date(bounty.deadline) : null,
      geography,
      required_skills: requiredSkills,
      url: `https://earn.superteam.fun/listings/${bounty.slug || bounty.id}`,
      published_at: bounty.publishedAt ? new Date(bounty.publishedAt) : new Date(),
      created_at: bounty.createdAt ? new Date(bounty.createdAt) : new Date(),
    };
  }

  // Transform grant to listing format
  transformGrantToListing(grant: any): Listing {
    return {
      id: grant.id,
      title: grant.title || 'Untitled Grant',
      sponsor_name: grant.sponsor?.name || 'Unknown Sponsor',
      type: 'grant',
      reward_token: grant.token || 'USDC',
      reward_amount: grant.maxReward,
      reward_usd_value: grant.maxReward || 0,
      is_variable_comp: true,
      min_reward_usd: grant.minReward,
      max_reward_usd: grant.maxReward,
      deadline: null, // Grants usually don't have deadlines
      geography: [grant.region || 'GLOBAL'],
      required_skills: (grant.skills as string[]) || [],
      url: `https://earn.superteam.fun/grants/${grant.slug || grant.id}`,
      published_at: grant.createdAt ? new Date(grant.createdAt) : new Date(),
      created_at: grant.createdAt ? new Date(grant.createdAt) : new Date(),
    };
  }
}

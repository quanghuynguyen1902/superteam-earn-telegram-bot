export interface User {
  id: string;
  telegramId: string;
  earnUserId?: string;
  geography?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  minUsdValue?: number;
  maxUsdValue?: number;
  notifyBounties: boolean;
  notifyProjects: boolean;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ListingType = 'bounty' | 'project' | 'grant';

export interface Listing {
  id: string;
  title: string;
  sponsor_name: string;
  type: ListingType;
  reward_token?: string;
  reward_amount?: number;
  reward_usd_value?: number;
  is_variable_comp?: boolean;
  min_reward_usd?: number;
  max_reward_usd?: number;
  deadline: Date | null;
  geography?: string[];
  required_skills?: string[];
  url: string;
  published_at: Date;
  created_at: Date;
}

export interface Notification {
  id: string;
  userId: string;
  listingId: string;
  sentAt: Date;
}

export interface NotificationContent {
  title: string;
  sponsor: string;
  type: ListingType;
  reward: string;
  deadline: string;
  url: string;
}
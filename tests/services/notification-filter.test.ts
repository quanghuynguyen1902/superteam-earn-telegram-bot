import { NotificationFilterService } from '../../src/services/notification-filter';
import { User, UserPreferences, Listing } from '../../src/types';

// Mock the EarnDatabaseService before importing
jest.mock('../../src/services/earn-db', () => ({
  EarnDatabaseService: jest.fn().mockImplementation(() => ({
    checkUserEligibility: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn(),
  })),
}));

describe('NotificationFilterService', () => {
  let filterService: NotificationFilterService;

  beforeEach(() => {
    filterService = new NotificationFilterService();
  });

  afterEach(async () => {
    if (filterService && typeof filterService.disconnect === 'function') {
      await filterService.disconnect();
    }
  });

  describe('filterListingsForUser', () => {
    const mockUser: User = {
      id: 1,
      telegram_id: 123456789,
      telegram_username: 'testuser',
      earn_user_id: 'earn-123',
      geography: 'India',
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
    };

    const mockPreferences: UserPreferences = {
      id: 1,
      user_id: 1,
      min_usd_value: 100,
      max_usd_value: 5000,
      notify_bounties: true,
      notify_projects: false,
      skills: ['react', 'typescript'],
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockListing: Listing = {
      id: 'test-listing-1',
      title: 'Test Bounty',
      sponsor_name: 'Test Sponsor',
      type: 'bounty',
      reward_token: 'USDC',
      reward_amount: 1000,
      reward_usd_value: 1000,
      deadline: new Date(),
      geography: ['India', 'Global'],
      required_skills: ['react'],
      url: 'https://earn.superteam.fun/test',
      published_at: new Date(),
      created_at: new Date(),
    };

    it('should filter listings based on listing type preference', async () => {
      const projectListing = { ...mockListing, type: 'project' as const };
      
      const filteredListings = await filterService.filterListingsForUser(
        mockUser,
        mockPreferences,
        [projectListing]
      );

      expect(filteredListings).toHaveLength(0);
    });

    it('should filter listings based on USD value', async () => {
      const expensiveListing = { ...mockListing, reward_usd_value: 10000 };
      
      const filteredListings = await filterService.filterListingsForUser(
        mockUser,
        mockPreferences,
        [expensiveListing]
      );

      expect(filteredListings).toHaveLength(0);
    });

    it('should filter listings based on skills', async () => {
      const skillMismatchListing = { ...mockListing, required_skills: ['python', 'django'] };
      
      const filteredListings = await filterService.filterListingsForUser(
        mockUser,
        mockPreferences,
        [skillMismatchListing]
      );

      expect(filteredListings).toHaveLength(0);
    });

    it('should filter listings based on geography', async () => {
      const geographyMismatchListing = { ...mockListing, geography: ['United States'] };
      const userWithoutGeo = { ...mockUser, geography: undefined };
      
      const filteredListings = await filterService.filterListingsForUser(
        userWithoutGeo,
        mockPreferences,
        [geographyMismatchListing]
      );

      expect(filteredListings).toHaveLength(0);
    });

    it('should include matching listings', async () => {
      const filteredListings = await filterService.filterListingsForUser(
        mockUser,
        mockPreferences,
        [mockListing]
      );

      expect(filteredListings).toHaveLength(1);
      expect(filteredListings[0]).toEqual(mockListing);
    });

    it('should include global listings regardless of user geography', async () => {
      const globalListing = { ...mockListing, geography: ['Global'] };
      const userWithoutGeo = { ...mockUser, geography: undefined };
      
      const filteredListings = await filterService.filterListingsForUser(
        userWithoutGeo,
        mockPreferences,
        [globalListing]
      );

      expect(filteredListings).toHaveLength(1);
    });

    it('should handle variable compensation listings', async () => {
      const variableListing = {
        ...mockListing,
        is_variable_comp: true,
        min_reward_usd: 200,
        max_reward_usd: 2000,
        reward_usd_value: undefined,
      };
      
      const filteredListings = await filterService.filterListingsForUser(
        mockUser,
        mockPreferences,
        [variableListing]
      );

      expect(filteredListings).toHaveLength(1);
    });
  });
});
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
      id: '1',
      telegramId: '123456789',
      earnUserId: 'earn-123',
      geography: 'India',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    const mockPreferences: UserPreferences = {
      id: '1',
      userId: '1',
      minUsdValue: 100,
      maxUsdValue: 5000,
      notifyBounties: true,
      notifyProjects: false,
      skills: ['react', 'typescript'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockListing: Listing = {
      id: 'test-listing-1',
      title: 'Test Bounty',
      sponsorName: 'Test Sponsor',
      type: 'bounty',
      rewardToken: 'USDC',
      rewardAmount: 1000,
      usdValue: 1000,
      deadline: new Date(),
      geography: ['India', 'Global'],
      skills: ['react'],
      url: 'https://earn.superteam.fun/test',
      publishedAt: new Date(),
      createdAt: new Date(),
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
      const expensiveListing = { ...mockListing, usdValue: 10000 };
      
      const filteredListings = await filterService.filterListingsForUser(
        mockUser,
        mockPreferences,
        [expensiveListing]
      );

      expect(filteredListings).toHaveLength(0);
    });

    it('should filter listings based on skills', async () => {
      const skillMismatchListing = { ...mockListing, skills: ['python', 'django'] };
      
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
        isVariableComp: true,
        minRewardUsd: 200,
        maxRewardUsd: 2000,
        usdValue: undefined,
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
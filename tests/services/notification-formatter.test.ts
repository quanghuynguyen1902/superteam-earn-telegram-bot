import { NotificationFormatterService } from '../../src/services/notification-formatter';
import { Listing } from '../../src/types';

describe('NotificationFormatterService', () => {
  let formatter: NotificationFormatterService;

  beforeEach(() => {
    formatter = new NotificationFormatterService();
  });

  describe('formatNotification', () => {
    const baseListing: Listing = {
      id: 'test-123',
      title: 'Build a DeFi Dashboard',
      sponsor_name: 'Solana Foundation',
      type: 'bounty',
      reward_token: 'USDC',
      reward_amount: 1000,
      reward_usd_value: 1000,
      deadline: new Date('2024-12-31'),
      geography: ['Global'],
      required_skills: ['react', 'web3'],
      url: 'https://earn.superteam.fun/listings/test',
      published_at: new Date(),
      created_at: new Date(),
    };

    it('should format a basic bounty notification', () => {
      const formatted = formatter.formatNotification(baseListing);

      expect(formatted).toContain('🚀 *New Bounty Alert!*');
      expect(formatted).toContain('Build a DeFi Dashboard');
      expect(formatted).toContain('Solana Foundation');
      expect(formatted).toContain('1,000 USDC');
      expect(formatted).toContain('utm_source=telegrambot');
    });

    it('should format a project notification', () => {
      const projectListing = { ...baseListing, type: 'project' as const };
      const formatted = formatter.formatNotification(projectListing);

      expect(formatted).toContain('🚀 *New Project Alert!*');
    });

    it('should format variable compensation', () => {
      const variableListing = {
        ...baseListing,
        is_variable_comp: true,
        reward_usd_value: undefined,
      };
      const formatted = formatter.formatNotification(variableListing);

      expect(formatted).toContain('Variable Comp');
    });

    it('should format range compensation', () => {
      const rangeListing = {
        ...baseListing,
        min_reward_usd: 500,
        max_reward_usd: 2000,
        reward_usd_value: undefined,
      };
      const formatted = formatter.formatNotification(rangeListing);

      expect(formatted).toContain('$500 - $2,000 USD');
    });

    it('should escape markdown characters', () => {
      const listingWithSpecialChars = {
        ...baseListing,
        title: 'Build a *special* dashboard [urgent]',
        sponsor_name: 'Test_Company & Co.',
      };
      const formatted = formatter.formatNotification(listingWithSpecialChars);

      expect(formatted).toContain('Build a \\*special\\* dashboard \\[urgent\\]');
      expect(formatted).toContain('Test\\_Company \\& Co\\.');
    });

    it('should add UTM tracking to URLs', () => {
      const formatted = formatter.formatNotification(baseListing);
      
      expect(formatted).toContain('https://earn.superteam.fun/listings/test?utm_source=telegrambot');
    });

    it('should handle URLs that already have query parameters', () => {
      const listingWithParams = {
        ...baseListing,
        url: 'https://earn.superteam.fun/listings/test?ref=twitter',
      };
      const formatted = formatter.formatNotification(listingWithParams);
      
      expect(formatted).toContain('https://earn.superteam.fun/listings/test?ref=twitter&utm_source=telegrambot');
    });
  });

  describe('formatBatchSummary', () => {
    it('should format singular summary', () => {
      const summary = formatter.formatBatchSummary(1);
      
      expect(summary).toContain('You have 1 new opportunity');
      expect(summary).not.toContain('opportunities');
    });

    it('should format plural summary', () => {
      const summary = formatter.formatBatchSummary(5);
      
      expect(summary).toContain('You have 5 new opportunities');
    });
  });

  describe('deadline formatting', () => {
    const testBaseListing: Listing = {
      id: 'test-123',
      title: 'Build a DeFi Dashboard',
      sponsor_name: 'Solana Foundation',
      type: 'bounty',
      reward_token: 'USDC',
      reward_amount: 1000,
      reward_usd_value: 1000,
      deadline: new Date('2024-12-31'),
      geography: ['Global'],
      required_skills: ['react', 'web3'],
      url: 'https://earn.superteam.fun/listings/test',
      published_at: new Date(),
      created_at: new Date(),
    };

    beforeEach(() => {
      // Mock Date.now() to return a consistent date for testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should format deadline as "Today" for same day', () => {
      const listing = {
        ...testBaseListing,
        deadline: new Date('2024-01-15T23:59:59Z'),
      };
      const formatted = formatter.formatNotification(listing);
      
      expect(formatted).toContain('Today');
    });

    it('should format deadline as "Tomorrow" for next day', () => {
      const listing = {
        ...testBaseListing,
        deadline: new Date('2024-01-16T10:00:00Z'),
      };
      const formatted = formatter.formatNotification(listing);
      
      expect(formatted).toContain('Tomorrow');
    });

    it('should format deadline in days for near future', () => {
      const listing = {
        ...testBaseListing,
        deadline: new Date('2024-01-20T10:00:00Z'),
      };
      const formatted = formatter.formatNotification(listing);
      
      expect(formatted).toContain('5 days');
    });
  });
});
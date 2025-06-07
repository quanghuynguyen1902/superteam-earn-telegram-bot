# Database Schema Setup

This project uses a dual-database architecture with separate Prisma schemas:
1. **MySQL** - Earn database (complete Superteam Earn platform data)
2. **PostgreSQL** - Bot-specific database (notification tracking, user preferences)

## Quick Setup

### 1. Create Databases
```bash
# Start both databases
docker-compose up -d
```

### 2. Migrate Databases
```bash
# Generate Prisma clients
npx prisma generate --schema=prisma/bot-schema.prisma
npx prisma generate --schema=prisma/earn-schema.prisma

# Create database tables
npx prisma db push --schema=prisma/bot-schema.prisma
npx prisma db push --schema=prisma/earn-schema.prisma
```

### 3. Seed Databases
```bash
# Add sample data
npx tsx prisma/bot-seed.ts
npx tsx prisma/earn-seed.ts
```

## Database Schemas

### Earn Database (MySQL)
Located in `prisma/earn-schema.prisma` - Complete Superteam Earn platform schema:

#### Core Models
- **Bounties** - Freelance opportunities with rewards
- **Grants** - Funding opportunities for projects
- **Sponsors** - Organizations posting opportunities
- **User** - Platform users with profiles and skills
- **Submission** - User submissions to bounties/projects
- **Comment** - Comments on listings and submissions

#### Supporting Models
- **BountiesTemplates** - Reusable bounty templates
- **Hackathon** - Special events and competitions
- **GrantApplication** - Applications for grant funding
- **GrantTranche** - Milestone-based grant payments
- **Scouts** - Talent discovery and recommendations
- **TalentRankings** - User performance metrics
- **PoW** - Proof of Work showcases
- **EmailSettings** - User email preferences
- **UserSponsors** - Organization memberships
- **CreditLedger** - User credit tracking

#### Key Features
- **Comprehensive reward system** with multiple compensation types
- **Advanced filtering** by skills, regions, and experience
- **Talent ranking system** with performance metrics
- **Grant management** with milestone tracking
- **Hackathon support** with special prize structures

### Bot Database (PostgreSQL)
Located in `prisma/bot-schema.prisma` - Bot-specific operational data:

#### Core Models
- **BotUser** - Telegram users who interact with bot
- **UserPreferences** - Notification preferences and filters
- **NotificationLog** - Track sent notifications and engagement
- **NotificationQueue** - Process notifications with delays
- **BotAnalytics** - Usage metrics and performance data

#### Supporting Models
- **UserSession** - User interaction state management
- **BotConfig** - Bot configuration and feature flags
- **ErrorLog** - Error tracking and debugging
- **AdminLog** - Administrative actions and monitoring
- **WebhookEvent** - Incoming webhook processing

## Key Features

### Smart Notification System
```typescript
interface UserPreferences {
  enableNotifications: boolean;
  enableBounties: boolean;
  enableProjects: boolean;
  enableGrants: boolean;
  enableHackathons: boolean;
  minUsdValue?: number;
  maxUsdValue?: number;
  regions: string[];
  skills: string[];
  useProfileSkills: boolean;
  quietHours: { start: string; end: string };
  timezone: string;
  onlyFeatured: boolean;
  excludeExpired: boolean;
}
```

### Advanced Filtering
- **Skill-based matching** using user profile or custom skills
- **Geographic filtering** with region preferences
- **Value-based filtering** with min/max USD thresholds
- **Type filtering** for bounties, projects, grants, hackathons
- **Quality filtering** with featured-only options

### Notification Processing
- **12-hour delay** after listing publication
- **Duplicate prevention** per user/listing combination
- **Quiet hours** respect user timezones
- **Click tracking** with UTM parameters
- **Failure handling** with retry logic and error tracking

### Analytics & Monitoring
- **Daily user metrics** and engagement tracking
- **Notification delivery rates** and performance
- **Error tracking** with context and resolution
- **Performance monitoring** with response times
- **User behavior analysis** with command usage

## Database Commands

### Earn Database (MySQL)
```bash
# Generate Prisma client
npx prisma generate --schema=prisma/earn-schema.prisma

# Run migrations
npx prisma migrate dev --schema=prisma/earn-schema.prisma

# Seed with sample data
npx tsx prisma/earn-seed.ts

# Open Prisma Studio
npx prisma studio --schema=prisma/earn-schema.prisma --port 5556
```

### Bot Database (PostgreSQL)
```bash
# Generate bot Prisma client
npx prisma generate --schema=prisma/bot-schema.prisma

# Run bot migrations
npx prisma migrate dev --schema=prisma/bot-schema.prisma

# Seed bot database
npx tsx prisma/bot-seed.ts

# Open bot Prisma Studio
npx prisma studio --schema=prisma/bot-schema.prisma --port 5557
```

## Environment Variables

### Required
- `TELEGRAM_BOT_TOKEN` - Telegram bot token from BotFather
- `DATABASE_URL` - MySQL connection string for Earn database
- `BOT_DATABASE_URL` - PostgreSQL connection string for bot database

### Optional Configuration
- `NOTIFICATION_DELAY_HOURS` - Delay before sending notifications (default: 12)
- `MAX_NOTIFICATIONS_PER_USER_PER_DAY` - Rate limiting (default: 50)
- `QUIET_HOURS_DEFAULT_START` - Default quiet hours start (default: 22:00)
- `QUIET_HOURS_DEFAULT_END` - Default quiet hours end (default: 08:00)
- `BOT_MAINTENANCE_MODE` - Disable bot functionality (default: false)

## Architecture Benefits

### Separation of Concerns
- **Earn Database**: Read-only access to complete platform data
- **Bot Database**: Full control over notification and user management
- **Independent scaling** and optimization for each use case

### Performance Optimization
- **Specialized indexing** for notification filtering queries
- **Efficient skill matching** with JSON field optimization
- **Queue-based processing** for batch notification handling
- **Caching strategies** for frequently accessed data

### Data Integrity & Safety
- **No impact** on existing Earn platform operations
- **Safe experimentation** with bot features and schema changes
- **Independent backup** and recovery strategies
- **Rollback capabilities** for bot-specific changes

### Scalability Features
- **Horizontal scaling** potential for bot operations
- **Database sharding** options for user data
- **Queue processing** for high-volume notifications
- **Monitoring and alerting** for performance issues

## Schema Relationships

### Cross-Database References
The bot maintains references to Earn data using string IDs:
- `BotUser.earnUserId` → `User.id` (Earn database)
- `NotificationLog.listingId` → `Bounties.id` (Earn database)
- `NotificationQueue.listingData` → Cached bounty/grant data

### Data Synchronization
- **User matching** via email addresses between databases
- **Listing data caching** in notification queue for performance
- **Periodic sync** jobs for user profile updates
- **Webhook integration** for real-time listing updates

## Usage Examples

### Connect to Both Databases
```typescript
import { PrismaClient as EarnClient } from '../node_modules/.prisma/earn-client';
import { PrismaClient as BotClient } from '../node_modules/.prisma/bot-client';

const earnDb = new EarnClient();
const botDb = new BotClient();

// Query Earn data
const activeBounties = await earnDb.bounties.findMany({
  where: {
    isPublished: true,
    isActive: true,
    status: 'OPEN'
  },
  include: {
    sponsor: true,
    poc: true
  }
});

// Store bot preferences
await botDb.userPreferences.create({
  data: {
    userId: 'bot-user-id',
    enableBounties: true,
    minUsdValue: 1000,
    skills: ['JavaScript', 'React', 'Solana'],
    regions: ['GLOBAL', 'USA']
  }
});
```

### Advanced Notification Filtering
```typescript
// Get eligible users for a specific bounty
const bounty = await earnDb.bounties.findUnique({
  where: { id: 'bounty-id' },
  include: { sponsor: true }
});

const eligibleUsers = await botDb.botUser.findMany({
  where: {
    isActive: true,
    preferences: {
      enableNotifications: true,
      enableBounties: true,
      OR: [
        { minUsdValue: null },
        { minUsdValue: { lte: bounty.usdValue } }
      ],
      AND: [
        {
          OR: [
            { maxUsdValue: null },
            { maxUsdValue: { gte: bounty.usdValue } }
          ]
        }
      ]
    }
  },
  include: { 
    preferences: true,
    sessions: true 
  }
});
```

### Skill Matching Logic
```typescript
// Match users based on skills
const bountySkills = bounty.skills as string[];
const matchingUsers = eligibleUsers.filter(user => {
  const userSkills = user.preferences?.skills || [];
  const useProfileSkills = user.preferences?.useProfileSkills;
  
  if (useProfileSkills && user.earnUserId) {
    // Fetch skills from Earn database
    const earnUser = await earnDb.user.findUnique({
      where: { id: user.earnUserId }
    });
    const profileSkills = earnUser?.skills as string[] || [];
    return bountySkills.some(skill => 
      profileSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
  }
  
  return bountySkills.some(skill => 
    userSkills.some(userSkill => 
      userSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );
});
```
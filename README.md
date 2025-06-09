# Superteam Earn Telegram Notification Bot

A Telegram bot that provides personalized notifications for new bounties, projects, and grants published on Superteam Earn platform. Get notified only for opportunities that match your skills, location, and compensation preferences.

## Demo Video

https://www.youtube.com/watch?v=k96zsb9BAA0

## Features

### 🚀 **Core Functionality**
- **Personalized Notifications**: Get notified only for opportunities you're eligible for
- **12-Hour Delay**: Notifications sent 12 hours after listing publication
- **Smart Filtering**: Filter by USD value, listing type, skills, and geography
- **UTM Tracking**: All links include `?utm_source=telegrambot` for analytics

### 🎯 **Notification Filters**
- **USD Value Range**: Set minimum and maximum compensation amounts
- **Listing Types**: Choose between bounties, projects, or both
- **Skills**: Select from comprehensive skill categories
- **Geography**: Automatically matches your location and global opportunities

### 📱 **User Experience**
- **Seamless Integration**: Direct link from Superteam Earn user menu
- **Telegram Interface**: All settings managed within the bot
- **Rich Notifications**: Include title, sponsor, reward details, deadline, and direct links

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Telegraf (Telegram Bot Framework)
- **Database**: Dual-database architecture
  - PostgreSQL (Bot operations) with Prisma ORM
  - MySQL (Earn platform data) with Prisma ORM
- **Deployment**: Docker, Railway support
- **Development**: Hot reload with tsx
- **Testing**: Jest with comprehensive test coverage
- **Logging**: Winston structured logging

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- Telegram Bot Token from [@BotFather](https://t.me/botfather)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd superteam-earn-telegram-bot
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start databases**
   ```bash
   docker-compose up -d
   ```

5. **Set up databases**
   ```bash
   # Generate Prisma clients
   npx prisma generate --schema=prisma/bot-schema.prisma
   npx prisma generate --schema=prisma/earn-schema.prisma
   
   # Create database tables
   npx prisma db push --schema=prisma/bot-schema.prisma
   npx prisma db push --schema=prisma/earn-schema.prisma
   
   # Seed with sample data
   npx tsx prisma/bot-seed.ts
   npx tsx prisma/earn-seed.ts
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from @BotFather | ✅ | `1234567890:ABC...` |
| `BOT_DATABASE_URL` | PostgreSQL connection for bot operations | ✅ | `postgresql://postgres:postgres123@localhost:35432/superteam_earn_bot` |
| `EARN_DATABASE_URL` | MySQL connection for Earn platform data | ✅ | `mysql://earn_user:earn_pass123@localhost:33306/earn_database` |
| `NODE_ENV` | Environment (development/production) | ❌ | `production` |
| `LOG_LEVEL` | Logging level | ❌ | `info` |
| `NOTIFICATION_DELAY_HOURS` | Notification delay for bounties | ❌ | `12` |
| `BATCH_SIZE` | User processing batch size | ❌ | `100` |
| `RATE_LIMIT_PER_SECOND` | Rate limit for notifications | ❌ | `30` |

## Bot Commands

### Basic Commands
- `/start` - Start the bot and create user account
- `/help` - Show available commands and features
- `/status` - Check notification settings and statistics
- `/stop` - Pause all notifications

### Preference Management
- `/preferences` - View and manage all notification preferences
- `/setusd` - Set USD value filters (minimum and maximum)
- `/settype` - Choose notification types (bounties/projects/grants)
- `/setskills` - Select skills to filter opportunities by
- `/setgeo` - Set your geographic location for relevant opportunities

### Command Examples
```bash
# USD filtering
/setusd 100 5000        # Notify for $100-$5000 listings
/setusd 500             # Notify for $500+ listings only

# Type selection
/settype bounties       # Only bounty notifications
/settype projects       # Only project notifications

# Skills and location
/setskills              # Opens interactive skill selection
/setgeo India           # Set location to India
/setgeo Global          # For worldwide opportunities
```

## API Endpoints

### Health Check
- `GET /health` - Application health status

## Database Architecture

The bot uses a sophisticated dual-database architecture designed for optimal performance and data separation:

### 1. Bot Database (PostgreSQL)
**Purpose**: Bot operations, user management, and notification tracking

**Key Models**:
```typescript
// Users who interact with the bot
model User {
  id          String @id @default(uuid())
  telegramId  String @unique
  earnUserId  String? // Link to Earn platform user
  geography   String?
  isActive    Boolean @default(true)
  
  preferences UserPreferences?
  notifications NotificationLog[]
}

// User notification preferences
model UserPreferences {
  id             String   @id @default(uuid())
  userId         String   @unique
  notifyBounties Boolean  @default(true)
  notifyProjects Boolean  @default(true)
  minUsdValue    Float?
  maxUsdValue    Float?
  skills         String[] @default([])
}

// Notification tracking (prevents duplicates)
model NotificationLog {
  id        String   @id @default(uuid())
  userId    String
  listingId String   // Reference to Earn database listing
  sentAt    DateTime @default(now())
}
```

### 2. Earn Database (MySQL)
**Purpose**: Read-only access to complete Superteam Earn platform data

**Key Models**:
```typescript
// Bounties and projects
model Bounties {
  id           String    @id @default(uuid())
  title        String
  slug         String    @unique
  usdValue     Float?
  deadline     DateTime?
  skills       Json?
  region       String    @default("GLOBAL")
  status       status    @default(OPEN)
  isPublished  Boolean   @default(false)
  isActive     Boolean   @default(true)
  
  sponsor      Sponsors  @relation(fields: [sponsorId], references: [id])
  submissions  Submission[]
}

// Grant funding opportunities
model Grants {
  id          String @id @default(uuid())
  title       String
  minReward   Float?
  maxReward   Float?
  status      GrantStatus @default(OPEN)
  isPublished Boolean @default(false)
  
  sponsor     Sponsors @relation(fields: [sponsorId], references: [id])
}

// Platform users (for eligibility checking)
model User {
  id       String @id @default(uuid())
  email    String @unique
  location String?
  skills   Json?
  
  submissions Submission[]
}
```

### Benefits of Dual-Database Architecture

✅ **Performance**: Optimized queries for each use case  
✅ **Separation**: Bot operations don't impact Earn platform  
✅ **Scalability**: Independent scaling of bot and platform data  
✅ **Safety**: Read-only access to Earn data prevents accidents  
✅ **Flexibility**: Easy to modify bot schema without affecting platform

## Deployment

### Docker Deployment

1. **Build the image**
   ```bash
   docker build -t superteam-earn-bot .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     --name earn-bot \
     -p 3000:3000 \
     --env-file .env \
     superteam-earn-bot
   ```

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   pnpm build
   vercel --prod
   ```

### Railway Deployment

1. **Connect repository to Railway**
2. **Set environment variables**
3. **Deploy automatically on push**

## Development

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### Code Quality
```bash
# Linting
pnpm lint

# Formatting
pnpm format

# Type checking
pnpm build
```

### Database Operations
```bash
# Generate Prisma clients
npx prisma generate --schema=prisma/bot-schema.prisma
npx prisma generate --schema=prisma/earn-schema.prisma

# Push schema changes
npx prisma db push --schema=prisma/bot-schema.prisma
npx prisma db push --schema=prisma/earn-schema.prisma

# Seed databases with sample data
npx tsx prisma/bot-seed.ts
npx tsx prisma/earn-seed.ts

# View databases in Prisma Studio
npx prisma studio --schema=prisma/bot-schema.prisma --port 5557
npx prisma studio --schema=prisma/earn-schema.prisma --port 5556

# Docker operations
docker-compose up -d          # Start databases
docker-compose down -v        # Stop and remove data
docker-compose logs -f        # View logs
```

## Architecture

### Notification Flow
1. **Listing Detection** → Scheduler checks for new bounties/grants every 5 minutes
2. **Data Transformation** → Raw Earn data converted to unified listing format  
3. **User Filtering** → System identifies eligible users based on preferences
4. **Timing Logic** → Bounties delayed 12 hours, grants sent immediately
5. **Delivery** → Rich notifications sent via Telegram with tracking
6. **Logging** → Successful deliveries recorded to prevent duplicates

### Key Components

- **NotificationScheduler**: Cron-based system (every 5 minutes) that orchestrates the entire notification flow
- **EarnDatabaseService**: Interfaces with Earn database to fetch bounties, grants, and user data
- **NotificationFilterService**: Applies user preferences, prevents duplicates, handles eligibility logic
- **NotificationSenderService**: Formats and sends rich Telegram messages with error handling
- **Bot Commands**: Interactive Telegram commands for user onboarding and preference management

### Services Architecture

```typescript
// Main scheduler orchestrates everything
NotificationScheduler
├── EarnDatabaseService      // Data fetching
├── NotificationFilterService // User filtering  
└── NotificationSenderService // Message delivery

// Bot command handlers
BotCommands
├── /start     // User registration
├── /help      // Command information  
├── /status    // User statistics
├── /preferences // Settings management
└── /stop      // Pause notifications
```

## Security

- **Rate Limiting**: Protection against spam and abuse
- **Environment Variables**: Sensitive data stored securely
- **Database Isolation**: Separate database for bot operations

## Monitoring

### Health Checks
- `/health` endpoint for uptime monitoring
- Database connection status
- Telegram API connectivity

### Logging
- Structured logging with Winston
- Error tracking and alerting
- Performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact:
- Create an issue in this repository
- Join our Telegram support group: [Link]
- Email: support@superteam.fun

---

Built with ❤️ for the Superteam community

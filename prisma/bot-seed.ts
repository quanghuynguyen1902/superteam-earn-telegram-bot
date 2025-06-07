const { PrismaClient } = require('../node_modules/.prisma/bot-client');

const botDb = new PrismaClient();

async function main() {
  console.log('🌱 Starting bot database seeding...');

  // Clean existing data (in dependency order)
  await botDb.notificationLog.deleteMany();
  await botDb.userPreferences.deleteMany();
  await botDb.user.deleteMany();

  console.log('🗑️  Cleaned existing bot data');

  // Create sample bot users
  const users = await Promise.all([
    botDb.user.create({
      data: {
        telegramId: '123456789',
        earnUserId: 'earn-user-1',
        geography: 'United States',
        isActive: true,
      },
    }),
    botDb.user.create({
      data: {
        telegramId: '987654321',
        earnUserId: 'earn-user-2',
        geography: 'Global',
        isActive: true,
      },
    }),
    botDb.user.create({
      data: {
        telegramId: '555666777',
        earnUserId: 'earn-user-3',
        geography: 'Canada',
        isActive: true,
      },
    }),
    botDb.user.create({
      data: {
        telegramId: '111222333',
        geography: 'Global',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created bot users');

  // Create user preferences
  const userPreferences = await Promise.all([
    // Developer interested in high-value bounties
    botDb.userPreferences.create({
      data: {
        userId: users[0].id,
        notifyBounties: true,
        notifyProjects: true,
        minUsdValue: 1000,
        maxUsdValue: null,
        skills: ['JavaScript', 'React', 'Solana', 'Rust', 'Smart Contracts'],
      },
    }),
    // Designer interested in design work
    botDb.userPreferences.create({
      data: {
        userId: users[1].id,
        notifyBounties: true,
        notifyProjects: false,
        minUsdValue: 500,
        maxUsdValue: 5000,
        skills: ['UI/UX Design', 'Figma', 'Graphic Design', 'Prototyping'],
      },
    }),
    // Blockchain developer interested in all opportunities
    botDb.userPreferences.create({
      data: {
        userId: users[2].id,
        notifyBounties: true,
        notifyProjects: true,
        minUsdValue: null,
        maxUsdValue: null,
        skills: ['Rust', 'Solana', 'Blockchain', 'DeFi', 'Smart Contracts', 'Web3'],
      },
    }),
    // New user with default preferences
    botDb.userPreferences.create({
      data: {
        userId: users[3].id,
        notifyBounties: true,
        notifyProjects: true,
        skills: [],
      },
    }),
  ]);

  console.log('✅ Created user preferences');

  // Create sample notification logs
  const notificationLogs = await Promise.all([
    botDb.notificationLog.create({
      data: {
        userId: users[0].id,
        listingId: 'listing-1',
      },
    }),
    botDb.notificationLog.create({
      data: {
        userId: users[1].id,
        listingId: 'listing-2',
      },
    }),
    botDb.notificationLog.create({
      data: {
        userId: users[2].id,
        listingId: 'listing-1',
      },
    }),
  ]);

  console.log('✅ Created notification logs');

  console.log('🎉 Bot database seeding completed successfully!');
  
  // Print summary
  console.log('\n📊 Bot Seeding Summary:');
  console.log(`   • ${users.length} bot users created`);
  console.log(`   • ${userPreferences.length} user preferences created`);
  console.log(`   • ${notificationLogs.length} notification logs created`);
}

main()
  .then(async () => {
    await botDb.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during bot seeding:', e);
    await botDb.$disconnect();
    process.exit(1);
  });
import { PrismaClient } from '@prisma/client';
import { PrismaClient as BotPrismaClient } from '../node_modules/.prisma/bot-client';

async function verifyDatabases() {
  console.log('🔍 Verifying database connections and data...\n');

  // Test Earn Database (MySQL)
  console.log('📊 Checking Earn Database (MySQL)...');
  try {
    const earnDb = new PrismaClient();
    await earnDb.$connect();
    
    const bounties = await earnDb.bounties.count();
    const users = await earnDb.user.count();
    const sponsors = await earnDb.sponsors.count();
    const grants = await earnDb.grants.count();
    
    console.log(`   ✅ Connected successfully`);
    console.log(`   📝 Bounties: ${bounties}`);
    console.log(`   👥 Users: ${users}`);
    console.log(`   🏢 Sponsors: ${sponsors}`);
    console.log(`   💰 Grants: ${grants}`);
    
    await earnDb.$disconnect();
  } catch (error) {
    console.log(`   ❌ Connection failed:`, error);
    return;
  }

  console.log('\n🤖 Checking Bot Database (PostgreSQL)...');
  try {
    const botDb = new BotPrismaClient();
    await botDb.$connect();
    
    const botUsers = await botDb.botUser.count();
    const preferences = await botDb.userPreferences.count();
    const notifications = await botDb.notificationLog.count();
    const queue = await botDb.notificationQueue.count();
    const configs = await botDb.botConfig.count();
    
    console.log(`   ✅ Connected successfully`);
    console.log(`   👤 Bot Users: ${botUsers}`);
    console.log(`   ⚙️  Preferences: ${preferences}`);
    console.log(`   📬 Notification Logs: ${notifications}`);
    console.log(`   📥 Queue Entries: ${queue}`);
    console.log(`   🔧 Configurations: ${configs}`);
    
    await botDb.$disconnect();
  } catch (error) {
    console.log(`   ❌ Connection failed:`, error);
    return;
  }

  console.log('\n🎉 Both databases are working correctly!');
  console.log('\n🚀 Ready to start the Telegram bot!');
  console.log('\nNext steps:');
  console.log('1. Set TELEGRAM_BOT_TOKEN in .env file');
  console.log('2. Run: pnpm dev');
  console.log('3. Open Prisma Studio: pnpm db:studio or pnpm bot-db:studio');
}

verifyDatabases().catch(console.error);
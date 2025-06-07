// Test script to manually trigger notifications
require('dotenv').config();

const { NotificationScheduler } = require('./dist/services/notification-scheduler');
const { createBot } = require('./dist/bot');

async function testNotifications() {
  console.log('🔍 Testing notification system...');
  
  try {
    // Create a dummy bot for testing
    const bot = createBot();
    
    // Create notification scheduler
    const scheduler = new NotificationScheduler(bot);
    
    // Run the check manually
    console.log('📋 Checking for listings to notify...');
    await scheduler.checkAndSendNotifications();
    
    console.log('✅ Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testNotifications();
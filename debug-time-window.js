// Debug the time window calculation
require('dotenv').config();

async function debugTimeWindow() {
  const delayHours = 12;
  
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - delayHours);
  startTime.setMinutes(startTime.getMinutes() - 5); // 5-minute window before

  const endTime = new Date();
  endTime.setHours(endTime.getHours() - delayHours);
  endTime.setMinutes(endTime.getMinutes() + 5); // 5-minute window after
  
  console.log('Current time:', new Date().toISOString());
  console.log('Looking for listings published between:');
  console.log('Start:', startTime.toISOString());
  console.log('End:', endTime.toISOString());
  
  const { EarnDatabaseService } = require('./dist/services/earn-db');
  const earnDb = new EarnDatabaseService();
  
  try {
    const listings = await earnDb.getListingsForNotification(delayHours);
    console.log(`Found ${listings.length} listings`);
    
    if (listings.length > 0) {
      listings.forEach(listing => {
        console.log(`- ${listing.title} (published: ${listing.publishedAt})`);
      });
    }
    
    await earnDb.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugTimeWindow();
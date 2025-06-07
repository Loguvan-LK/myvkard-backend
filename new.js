// Script to check and clean up MongoDB indexes
const mongoose = require('mongoose');

async function checkAndCleanIndexes() {
  try {
    await mongoose.connect('mongodb+srv://myvkards:dVwUj0tL0L5GyMMG@cluster0.4rrgojw.mongodb.net/');
    
    // Check current indexes on users collection
    const indexes = await mongoose.connection.db.collection('users').indexes();
    console.log('Current indexes on users collection:');
    indexes.forEach(index => {
      console.log(index.name, ':', index.key);
    });
    
    // Drop problematic indexes related to old schema
    const problematicIndexes = [
      'nfcCards.cardId_1',
      'contacts.contactId_1', // if this exists from old schema
      'urls.urlId_1',
      'nfcCards.profiles.profileId' // if this exists from old schema
    ];
    
    for (const indexName of problematicIndexes) {
      try {
        await mongoose.connection.db.collection('users').dropIndex(indexName);
        console.log(`Dropped index: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`Index ${indexName} doesn't exist, skipping`);
        } else {
          console.error(`Error dropping ${indexName}:`, error.message);
        }
      }
    }
    
    console.log('Index cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndCleanIndexes();
const mongoose = require('mongoose');

const uri = 'mongodb+srv://myvkards:dVwUj0tL0L5GyMMG@cluster0.4rrgojw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function truncateAll() {
  await mongoose.connect(uri);
  const collections = await mongoose.connection.db.listCollections().toArray();

  for (const collection of collections) {
    console.log(`Truncating: ${collection.name}`);
    await mongoose.connection.db.collection(collection.name).deleteMany({});
  }

  console.log('✅ All collections truncated.');
  await mongoose.disconnect();
}

truncateAll().catch(err => {
  console.error('❌ Error:', err);
});

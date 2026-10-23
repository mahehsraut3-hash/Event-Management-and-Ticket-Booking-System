const dotenv = require('dotenv');
const connectDB = require('../config/db');
const { User, Event } = require('../models');
const { getSeedEvents } = require('../utils/seedData');
const { isMongoLive, memoryStore } = require('../models/dataStore');

dotenv.config();

const runSeed = async () => {
  console.log('[Seed] Starting Event & User Database Seed...');
  await connectDB();

  try {
    // 1. Get or create organizer
    let organizer = await User.findOne({ email: 'organizer@example.com' });
    if (!organizer) {
      organizer = await User.create({
        name: 'Premier Events Org',
        email: 'organizer@example.com',
        passwordHash: 'password123',
        role: 'organizer'
      });
      console.log('[Seed] Created default organizer account.');
    }

    // 2. Clear old events if connected to live Mongo
    if (isMongoLive()) {
      await Event.mongooseModel.deleteMany({});
      console.log('[Seed] Cleared existing events in MongoDB.');

      const eventsData = getSeedEvents(organizer._id);
      await Event.mongooseModel.insertMany(eventsData);
      console.log(`[Seed] Successfully inserted ${eventsData.length} events into MongoDB.`);
    } else {
      console.log(`[Seed] In-Memory DataStore is active with ${memoryStore.events.length} pre-seeded events.`);
    }

    console.log('[Seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

runSeed();

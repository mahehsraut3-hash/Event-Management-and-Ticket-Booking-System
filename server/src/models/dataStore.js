const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { getSeedEvents } = require('../utils/seedData');

// Generate 24-character hexadecimal MongoDB ObjectId string
const generateId = () => {
  return new mongoose.Types.ObjectId().toString();
};

class MemoryStore {
  constructor() {
    this.users = [];
    this.events = [];
    this.bookings = [];
    this.tickets = [];
    this.initialized = false;
  }

  initSeedData() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Seed demo accounts
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('password123', salt);

    const attendeeId = generateId();
    const organizerId = generateId();
    const adminId = generateId();

    this.users.push({
      _id: attendeeId,
      id: attendeeId,
      name: 'Demo Attendee',
      email: 'attendee@example.com',
      passwordHash: defaultPasswordHash,
      role: 'attendee',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.users.push({
      _id: organizerId,
      id: organizerId,
      name: 'Premier Events Org',
      email: 'organizer@example.com',
      passwordHash: defaultPasswordHash,
      role: 'organizer',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.users.push({
      _id: adminId,
      id: adminId,
      name: 'System Admin',
      email: 'admin@example.com',
      passwordHash: defaultPasswordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 2. Seed realistic events linked to the organizer
    const seedEventsList = getSeedEvents(organizerId);
    seedEventsList.forEach(item => {
      const eventId = generateId();
      this.events.push({
        _id: eventId,
        id: eventId,
        ...item,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    console.log(`[DataStore] Seeded ${this.users.length} users and ${this.events.length} realistic events.`);
  }
}

const memoryStore = new MemoryStore();
memoryStore.initSeedData();

// Helper to attach User instance methods
const attachUserMethods = (userDoc) => {
  if (!userDoc) return null;
  const clone = { ...userDoc };
  clone.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
  };
  return clone;
};

// Check if Mongoose has an active live connection to MongoDB
const isMongoLive = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  memoryStore,
  generateId,
  attachUserMethods,
  isMongoLive
};

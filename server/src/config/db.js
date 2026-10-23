const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/tbs_events';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.warn(`[Database Notice] Could not connect to MongoDB at ${uri} (${error.message}).`);
    console.log(`[Database Notice] Activating resilient in-memory data store for local development.`);
    console.log(`[Database Notice] All auth, discovery, and bookings will function smoothly without requiring a local mongod service.`);
    console.log(`[Database Notice] (To connect to a live database, simply set MONGO_URI in server/.env with your MongoDB Atlas or local connection string).`);
  }
};

const getIsConnected = () => isConnected || mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.getIsConnected = getIsConnected;

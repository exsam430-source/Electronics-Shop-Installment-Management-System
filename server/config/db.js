const mongoose = require('mongoose');

const connectDB = async (maxRetries = 15, delayMs = 2000) => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/electronics_shop_db';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[MongoDB] Connecting to local database (attempt ${attempt}/${maxRetries})...`);
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 3000
      });
      console.log(`[MongoDB] Connected successfully: ${conn.connection.host} / ${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.warn(`[MongoDB] Connection attempt ${attempt} waiting: ${error.message}`);
      if (attempt === maxRetries) {
        console.error(`[MongoDB Fatal Error]: Could not establish database connection after ${maxRetries} attempts.`);
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

module.exports = connectDB;

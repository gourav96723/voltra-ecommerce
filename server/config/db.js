const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce_db';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    isConnected = false;
    console.error(`[db] MongoDB connection failed: ${err.message}`);
    console.error('[db] The API will still boot, but any DB-dependent route will return 503 until a database is reachable.');
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[db] MongoDB disconnected');
  });
};

const isDbConnected = () => isConnected;

module.exports = { connectDB, isDbConnected };

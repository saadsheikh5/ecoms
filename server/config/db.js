const mongoose = require('mongoose');

const ATLAS_SRV_FALLBACKS = {
  'cluster0.w2ymfcc.mongodb.net': {
    hosts: [
      'ac-1t7kbu5-shard-00-00.w2ymfcc.mongodb.net:27017',
      'ac-1t7kbu5-shard-00-01.w2ymfcc.mongodb.net:27017',
      'ac-1t7kbu5-shard-00-02.w2ymfcc.mongodb.net:27017',
    ],
    options: {
      authSource: 'admin',
      replicaSet: 'atlas-10hqzt-shard-0',
      tls: 'true',
    },
  },
};

const getMongoUri = () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || !mongoUri.startsWith('mongodb+srv://')) {
    return mongoUri;
  }

  const parsedUri = new URL(mongoUri);
  const fallback = ATLAS_SRV_FALLBACKS[parsedUri.hostname];

  if (!fallback) {
    return mongoUri;
  }

  const params = new URLSearchParams(parsedUri.search);
  Object.entries(fallback.options).forEach(([key, value]) => {
    if (!params.has(key)) {
      params.set(key, value);
    }
  });

  const auth = parsedUri.username
    ? `${parsedUri.username}:${parsedUri.password}@`
    : '';
  const path = parsedUri.pathname === '/' ? '' : parsedUri.pathname;
  const query = params.toString() ? `?${params.toString()}` : '';

  console.log('Using direct MongoDB seed-list fallback for Atlas DNS SRV lookup.');
  return `mongodb://${auth}${fallback.hosts.join(',')}${path}${query}`;
};

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MongoDB connection failed: MONGO_URI is not configured.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(getMongoUri(), {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    return null;
  }
};

module.exports = connectDB;

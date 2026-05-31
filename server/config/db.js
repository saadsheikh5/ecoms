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

const getMongoFallbackUri = () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || !mongoUri.startsWith('mongodb+srv://')) {
    return null;
  }

  const parsedUri = new URL(mongoUri);
  const fallback = ATLAS_SRV_FALLBACKS[parsedUri.hostname];

  if (!fallback) {
    return null;
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

  return `mongodb://${auth}${fallback.hosts.join(',')}${path}${query}`;
};

const shouldRetryWithFallback = (error) => {
  const message = error?.message || '';
  return /querySrv|ENOTFOUND|ETIMEOUT|ESERVFAIL|ENODATA|EAI_AGAIN/i.test(message);
};

const connectMongo = (uri) => mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
});

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MongoDB connection failed: MONGO_URI is not configured.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    const conn = await connectMongo(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    const fallbackUri = getMongoFallbackUri();
    if (fallbackUri && shouldRetryWithFallback(error)) {
      try {
        console.warn(`MongoDB SRV lookup failed. Retrying with Atlas seed-list fallback. ${error.message}`);
        const conn = await connectMongo(fallbackUri);
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn;
      } catch (fallbackError) {
        console.error(`MongoDB fallback connection failed: ${fallbackError.message}`);
      }
    }

    console.error(`MongoDB connection failed: ${error.message}`);
    return null;
  }
};

module.exports = connectDB;

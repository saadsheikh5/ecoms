const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { handleStripeWebhook } = require('./controllers/paymentController');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const readPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'https://jtsbeautyllc.com',
  'https://www.jtsbeautyllc.com',
  'https://api.jtsbeautyllc.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin(origin, callback) {
    const isLocalDevOrigin = !isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || allowedOrigins.has(origin) || isLocalDevOrigin) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: readPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
  max: readPositiveInt(process.env.RATE_LIMIT_MAX, isProduction ? 2000 : 1000),
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health',
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

const loginLimiter = rateLimit({
  windowMs: readPositiveInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: readPositiveInt(process.env.LOGIN_RATE_LIMIT_MAX, isProduction ? 10 : 100),
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes.',
});
app.use('/api/auth/login', loginLimiter);

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset attempts, please try again after 15 minutes.',
});
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/auth/change-email/request', forgotPasswordLimiter);
app.use('/api/auth/change-email/resend', forgotPasswordLimiter);

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  message: 'Too many verification attempts, please try again later.',
});
app.use('/api/auth/2fa/verify-login', otpLimiter);
app.use('/api/auth/2fa/confirm', otpLimiter);
app.use('/api/auth/change-email/verify-code', otpLimiter);
app.use('/api/auth/reset-password-code', otpLimiter);

app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(mongoSanitize());
app.use(xssClean());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({
    message: 'JTS Beauty API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    status: databaseConnected ? 'ok' : 'degraded',
    service: 'jts-beauty-api',
    database: databaseConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: 'Database is unavailable. Check MongoDB Atlas Network Access/IP whitelist and restart the server.',
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

validateEnvironment();

connectDB().then((connection) => {
  if (!connection) {
    console.error('Server startup aborted because MongoDB connection could not be established.');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the existing server or set a different PORT in server/.env.`);
      process.exit(1);
    }

    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  });
});

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/database');
const env = require('./src/config/env');
const seedAdmin = require('./src/scripts/seedAdmin');
const settingsService = require('./src/services/settings.service');
const productService = require('./src/services/product.service');
const { errorHandler, notFoundHandler } = require('./src/middlewares/error.middleware');
const reminderCron = require('./src/jobs/reminderCron');

const authRoutes = require('./src/routes/auth.routes');
const employeeRoutes = require('./src/routes/employee.routes');
const branchRoutes = require('./src/routes/branch.routes');
const bookingRoutes = require('./src/routes/booking.routes');
const userRoutes = require('./src/routes/user.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const settingsRoutes = require('./src/routes/settings.routes');
const marketingRoutes = require('./src/routes/marketing.routes');
const productRoutes = require('./src/routes/product.routes');

const app = express();
let server;
let isShuttingDown = false;

const corsOriginValidator = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  if (env.CORS_ORIGINS.length === 0) {
    return callback(null, true);
  }

  if (env.CORS_ORIGINS.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS blocked for origin: ${origin}`));
};

app.disable('x-powered-by');
app.set('trust proxy', env.TRUST_PROXY);

app.use(helmet());
app.use(hpp());
app.use(compression());
app.use(
  cors({
    origin: corsOriginValidator,
    credentials: true,
    optionsSuccessStatus: 204,
    exposedHeaders: ['X-New-Token'],
  })
);
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    message: { message: 'Too many requests, please try again later', data: null },
  })
);
app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.URL_ENCODED_LIMIT }));
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

app.get('/health', async (req, res) => {
  try {
    const dbConnected = mongoose.connection.readyState === 1;
    if (dbConnected) {
      await mongoose.connection.db.admin().ping();
    }

    const statusCode = dbConnected ? 200 : 503;
    return res.status(statusCode).json({
      message: dbConnected ? 'Server is healthy' : 'Database is not connected',
      data: {
        status: dbConnected ? 'ok' : 'degraded',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    return res.status(503).json({
      message: 'Health check failed',
      data: {
        status: 'down',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Blackbird Tattoo API',
    data: {
      version: '1.0.0',
      environment: env.NODE_ENV,
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        employees: '/api/employees',
        branches: '/api/branches',
        bookings: '/api/bookings',
        users: '/api/users',
        dashboard: '/api/dashboard',
        settings: '/api/settings',
        marketing: '/api/marketing',
        products: '/api/products',
      },
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/products', productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received, shutting down gracefully...`);
  const forceExitTimeout = setTimeout(() => process.exit(1), 10000);
  forceExitTimeout.unref();

  try {
    reminderCron.stop();

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    await mongoose.connection.close(false);
    clearTimeout(forceExitTimeout);
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error.message);
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();
    await settingsService.seedSettings();
    await productService.seedDefaultProduct();

    if (env.ENABLE_CRON) {
      reminderCron.start();
    } else {
      console.log('Reminder cron is disabled (ENABLE_CRON=false)');
    }

    server = app.listen(env.PORT, () => {
      console.log('Blackbird Tattoo API started');
      console.log(`Port: ${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown('uncaughtException');
});

startServer();

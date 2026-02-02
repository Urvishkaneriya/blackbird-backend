require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./src/config/database');
const seedAdmin = require('./src/scripts/seedAdmin');
const settingsService = require('./src/services/settings.service');
const { errorHandler, notFoundHandler } = require('./src/middlewares/error.middleware');
const reminderCron = require('./src/jobs/reminderCron');

// Routes
const authRoutes = require('./src/routes/auth.routes');
const employeeRoutes = require('./src/routes/employee.routes');
const branchRoutes = require('./src/routes/branch.routes');
const bookingRoutes = require('./src/routes/booking.routes');
const userRoutes = require('./src/routes/user.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const settingsRoutes = require('./src/routes/settings.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health Check API
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    if (dbStatus === 'connected') {
      await mongoose.connection.db.admin().ping();
      
      return res.status(200).json({
        message: 'Server is healthy',
        data: {
          database: {
            status: 'connected',
            name: mongoose.connection.name,
            host: mongoose.connection.host,
          },
          server: {
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
          }
        }
      });
    } else {
      return res.status(503).json({
        message: 'Database is not connected',
        data: {
          database: {
            status: dbStatus,
          }
        }
      });
    }
  } catch (error) {
    return res.status(503).json({
      message: 'Health check failed',
      data: {
        error: error.message,
      }
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Blackbird Tattoo API',
    data: {
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        employees: '/api/employees',
        branches: '/api/branches',
        bookings: '/api/bookings',
        users: '/api/users',
        dashboard: '/api/dashboard',
        settings: '/api/settings',
      }
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

// Connect to MongoDB, seed admin/settings, start cron, and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Seed admin user from .env
    await seedAdmin();
    // Seed default settings if none exist
    await settingsService.seedSettings();

    // Start reminder cron (every 12 hours)
    reminderCron.start();
    
    // Start server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 Blackbird Tattoo API Server');
      console.log('='.repeat(50));
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`💚 Health: http://localhost:${PORT}/health`);
      console.log('='.repeat(50) + '\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

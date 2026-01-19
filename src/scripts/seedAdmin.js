const adminService = require('../services/admin.service');

/**
 * Seed admin user from environment variables
 * Runs on application startup
 */
const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;

    // Validate environment variables
    if (!adminEmail || !adminPassword || !adminName) {
      console.warn('⚠️  Admin credentials not found in environment variables');
      console.warn('   Please set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME in .env file');
      return;
    }

    // Check if admin already exists
    const existingAdmin = await adminService.findByEmail(adminEmail);

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      return;
    }

    // Create admin
    const admin = await adminService.createAdmin({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
    });

    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;

const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const Branch = require('../models/branch.model');
const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const { PAYMENT_METHODS } = require('../config/constants');

/**
 * Get dashboard data for a date range
 * @param {Date} startDate - Start of range (start of day)
 * @param {Date} endDate - End of range (end of day)
 * @returns {Promise<Object>} Dashboard summary and breakdowns
 */
async function getDashboardData(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const matchDateRange = {
    $gte: start,
    $lte: end,
  };

  // 1. Summary for date range (bookings in range)
  const summaryAgg = await Booking.aggregate([
    { $match: { date: matchDateRange } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
        uniqueCustomers: { $addToSet: '$userId' },
      },
    },
    {
      $project: {
        _id: 0,
        totalBookings: 1,
        totalRevenue: 1,
        uniqueCustomersCount: { $size: '$uniqueCustomers' },
      },
    },
  ]);

  const summary = summaryAgg[0] || {
    totalBookings: 0,
    totalRevenue: 0,
    uniqueCustomersCount: 0,
  };

  const totalBookings = summary.totalBookings || 0;
  const totalRevenue = summary.totalRevenue || 0;
  const uniqueCustomersCount = summary.uniqueCustomersCount || 0;
  const averageOrderValue = totalBookings > 0 ? Math.round((totalRevenue / totalBookings) * 100) / 100 : 0;

  // 2. By branch (in date range)
  const byBranchAgg = await Booking.aggregate([
    { $match: { date: matchDateRange } },
    {
      $group: {
        _id: '$branchId',
        bookingCount: { $sum: 1 },
        revenue: { $sum: '$amount' },
      },
    },
    { $sort: { revenue: -1 } },
    {
      $lookup: {
        from: 'branches',
        localField: '_id',
        foreignField: '_id',
        as: 'branch',
      },
    },
    { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        branchId: '$_id',
        branchName: '$branch.name',
        branchNumber: '$branch.branchNumber',
        employeeCount: '$branch.employeeCount',
        bookingCount: 1,
        revenue: 1,
        _id: 0,
      },
    },
  ]);

  const byBranch = byBranchAgg.map((row) => ({
    branchId: row.branchId,
    branchName: row.branchName || 'N/A',
    branchNumber: row.branchNumber || 'N/A',
    employeeCount: row.employeeCount ?? 0,
    bookingCount: row.bookingCount,
    revenue: row.revenue,
  }));

  // 3. By payment method (in date range)
  const byPaymentAgg = await Booking.aggregate([
    { $match: { date: matchDateRange } },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  const byPaymentMethod = Object.values(PAYMENT_METHODS).map((method) => {
    const found = byPaymentAgg.find((r) => r._id === method);
    return {
      paymentMethod: method,
      count: found ? found.count : 0,
      totalAmount: found ? found.totalAmount : 0,
    };
  });

  // 4. Totals (snapshot - not date filtered): branches, employees, customers
  const [totalBranches, totalEmployees, totalCustomers] = await Promise.all([
    Branch.countDocuments(),
    Employee.countDocuments(),
    User.countDocuments(),
  ]);

  return {
    dateRange: {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    },
    summary: {
      totalBookings,
      totalRevenue,
      uniqueCustomersInRange: uniqueCustomersCount,
      averageOrderValue,
    },
    byBranch,
    byPaymentMethod,
    totals: {
      totalBranches,
      totalEmployees,
      totalCustomers,
    },
  };
}

/**
 * Get branch-scoped dashboard data for an employee's assigned branch
 * @param {Date} startDate - Start of range (start of day)
 * @param {Date} endDate - End of range (end of day)
 * @param {ObjectId} branchId - Branch ID
 * @returns {Promise<Object>} Branch dashboard summary and breakdowns
 */
async function getBranchDashboardData(startDate, endDate, branchId) {
  const branchObjectId = typeof branchId === 'string' ? new mongoose.Types.ObjectId(branchId) : branchId;

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const matchDateRange = { $gte: start, $lte: end };
  const matchBranchAndDate = { branchId: branchObjectId, date: matchDateRange };

  // Branch info
  const branch = await Branch.findById(branchObjectId).lean();
  if (!branch) {
    const err = new Error('Branch not found');
    err.statusCode = 404;
    throw err;
  }

  const branchInfo = {
    branchId: branch._id,
    branchName: branch.name,
    branchNumber: branch.branchNumber,
    employeeCount: branch.employeeCount ?? 0,
  };

  // Summary for this branch in date range
  const summaryAgg = await Booking.aggregate([
    { $match: matchBranchAndDate },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
        uniqueCustomers: { $addToSet: '$userId' },
      },
    },
    {
      $project: {
        _id: 0,
        totalBookings: 1,
        totalRevenue: 1,
        uniqueCustomersCount: { $size: '$uniqueCustomers' },
      },
    },
  ]);

  const summary = summaryAgg[0] || {
    totalBookings: 0,
    totalRevenue: 0,
    uniqueCustomersCount: 0,
  };

  const totalBookings = summary.totalBookings || 0;
  const totalRevenue = summary.totalRevenue || 0;
  const uniqueCustomersCount = summary.uniqueCustomersCount || 0;
  const averageOrderValue = totalBookings > 0 ? Math.round((totalRevenue / totalBookings) * 100) / 100 : 0;

  // By payment method for this branch
  const byPaymentAgg = await Booking.aggregate([
    { $match: matchBranchAndDate },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  const byPaymentMethod = Object.values(PAYMENT_METHODS).map((method) => {
    const found = byPaymentAgg.find((r) => r._id === method);
    return {
      paymentMethod: method,
      count: found ? found.count : 0,
      totalAmount: found ? found.totalAmount : 0,
    };
  });

  return {
    dateRange: {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    },
    branchInfo,
    summary: {
      totalBookings,
      totalRevenue,
      uniqueCustomersInRange: uniqueCustomersCount,
      averageOrderValue,
    },
    byPaymentMethod,
  };
}

module.exports = {
  getDashboardData,
  getBranchDashboardData,
};

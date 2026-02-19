const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const Branch = require('../models/branch.model');
const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const { PAYMENT_METHODS, PAYMENT_MODES } = require('../config/constants');

function normalizeDateRange(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function getSummary(match) {
  const summaryAgg = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$payment.totalAmount' },
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
  const averageOrderValue = totalBookings > 0 ? Math.round((totalRevenue / totalBookings) * 100) / 100 : 0;

  return {
    totalBookings,
    totalRevenue,
    uniqueCustomersInRange: summary.uniqueCustomersCount || 0,
    averageOrderValue,
  };
}

async function getPaymentBreakdown(match) {
  const byMethodAgg = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        cashAmount: { $sum: '$payment.cashAmount' },
        upiAmount: { $sum: '$payment.upiAmount' },
        cashCount: { $sum: { $cond: [{ $gt: ['$payment.cashAmount', 0] }, 1, 0] } },
        upiCount: { $sum: { $cond: [{ $gt: ['$payment.upiAmount', 0] }, 1, 0] } },
      },
    },
  ]);

  const row = byMethodAgg[0] || {
    cashAmount: 0,
    upiAmount: 0,
    cashCount: 0,
    upiCount: 0,
  };

  const byPaymentMethod = [
    {
      paymentMethod: PAYMENT_METHODS.CASH,
      count: row.cashCount,
      totalAmount: row.cashAmount,
    },
    {
      paymentMethod: PAYMENT_METHODS.UPI,
      count: row.upiCount,
      totalAmount: row.upiAmount,
    },
  ];

  const byModeAgg = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$payment.paymentMode',
        count: { $sum: 1 },
        totalAmount: { $sum: '$payment.totalAmount' },
      },
    },
  ]);

  const byPaymentMode = Object.values(PAYMENT_MODES).map((mode) => {
    const found = byModeAgg.find((r) => r._id === mode);
    return {
      paymentMode: mode,
      count: found ? found.count : 0,
      totalAmount: found ? found.totalAmount : 0,
    };
  });

  return { byPaymentMethod, byPaymentMode };
}

async function getTopProducts(match) {
  const agg = await Booking.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.productName' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        productName: 1,
        quantity: 1,
        revenue: 1,
      },
    },
  ]);

  return agg;
}

async function getDashboardData(startDate, endDate) {
  const { start, end } = normalizeDateRange(startDate, endDate);
  const match = { date: { $gte: start, $lte: end } };

  const [summary, paymentBreakdown, byBranchAgg, topProducts, totalBranches, totalEmployees, totalCustomers] = await Promise.all([
    getSummary(match),
    getPaymentBreakdown(match),
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$branchId',
          bookingCount: { $sum: 1 },
          revenue: { $sum: '$payment.totalAmount' },
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
          _id: 0,
          branchId: '$_id',
          branchName: '$branch.name',
          branchNumber: '$branch.branchNumber',
          employeeCount: '$branch.employeeCount',
          bookingCount: 1,
          revenue: 1,
        },
      },
    ]),
    getTopProducts(match),
    Branch.countDocuments(),
    Employee.countDocuments(),
    User.countDocuments(),
  ]);

  return {
    dateRange: {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    },
    summary,
    byBranch: byBranchAgg.map((row) => ({
      branchId: row.branchId,
      branchName: row.branchName || 'N/A',
      branchNumber: row.branchNumber || 'N/A',
      employeeCount: row.employeeCount ?? 0,
      bookingCount: row.bookingCount,
      revenue: row.revenue,
    })),
    byPaymentMethod: paymentBreakdown.byPaymentMethod,
    byPaymentMode: paymentBreakdown.byPaymentMode,
    topProducts,
    totals: {
      totalBranches,
      totalEmployees,
      totalCustomers,
    },
  };
}

async function getBranchDashboardData(startDate, endDate, branchId) {
  const branchObjectId = typeof branchId === 'string' ? new mongoose.Types.ObjectId(branchId) : branchId;
  const { start, end } = normalizeDateRange(startDate, endDate);
  const match = { branchId: branchObjectId, date: { $gte: start, $lte: end } };

  const branch = await Branch.findById(branchObjectId).lean();
  if (!branch) {
    const err = new Error('Branch not found');
    err.statusCode = 404;
    throw err;
  }

  const [summary, paymentBreakdown, topProducts] = await Promise.all([
    getSummary(match),
    getPaymentBreakdown(match),
    getTopProducts(match),
  ]);

  return {
    dateRange: {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    },
    branchInfo: {
      branchId: branch._id,
      branchName: branch.name,
      branchNumber: branch.branchNumber,
      employeeCount: branch.employeeCount ?? 0,
    },
    summary,
    byPaymentMethod: paymentBreakdown.byPaymentMethod,
    byPaymentMode: paymentBreakdown.byPaymentMode,
    topProducts,
  };
}

module.exports = {
  getDashboardData,
  getBranchDashboardData,
};

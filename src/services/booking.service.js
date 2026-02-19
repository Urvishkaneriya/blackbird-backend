const Booking = require('../models/booking.model');
const userService = require('./user.service');
const branchService = require('./branch.service');
const productService = require('./product.service');
const whatsappService = require('./whatsapp.service');
const settingsService = require('./settings.service');
const { PAYMENT_MODES, PAYMENT_METHODS } = require('../config/constants');

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

class BookingService {
  /**
   * Create new booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>} Created booking document
   */
  async createBooking(bookingData) {
    const {
      phone,
      email,
      fullName,
      size,
      artistName,
      branchId,
      employeeId,
      items,
      payment,
    } = bookingData;

    const branch = await branchService.findById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }

    const normalizedItems = await this.normalizeBookingItems(items);
    const itemTotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const normalizedPayment = this.normalizePayment(payment, itemTotal);

    let user = await userService.findByPhone(phone);
    if (user) {
      if (email && email !== user.email) {
        await userService.updateUserEmail(user._id, email);
      }
      await userService.updateUserStats(user._id, normalizedPayment.totalAmount);
    } else {
      user = await userService.createUser({
        fullName,
        phone,
        email,
      });
      await userService.updateUserStats(user._id, normalizedPayment.totalAmount);
    }

    const booking = new Booking({
      phone,
      email,
      fullName,
      size: size !== undefined && size !== null ? Number(size) : undefined,
      artistName,
      branchId,
      employeeId,
      userId: user._id,
      items: normalizedItems,
      payment: normalizedPayment,
      date: new Date(),
    });

    const savedBooking = await booking.save();

    try {
      const bookingWithBranch = await Booking.findById(savedBooking._id)
        .populate('branchId', 'name branchNumber')
        .lean();
      const settings = await settingsService.getSettings();

      const payload = {
        bookingNumber: bookingWithBranch.bookingNumber,
        fullName: bookingWithBranch.fullName,
        totalAmount: bookingWithBranch.payment.totalAmount,
        size: bookingWithBranch.size,
        payment: bookingWithBranch.payment,
        artistName: bookingWithBranch.artistName,
        date: bookingWithBranch.date,
        branchId: bookingWithBranch.branchId,
      };

      if (settings.whatsappEnabled) {
        await whatsappService.sendInvoiceMessage('+91' + phone.replace(/\D/g, '').replace(/^91/, ''), payload);
      }
      if (settings.whatsappEnabled && settings.selfInvoiceMessageEnabled && process.env.WHATSAPP_NUM) {
        const selfNum = process.env.WHATSAPP_NUM.replace(/\D/g, '').replace(/^91/, '');
        if (selfNum) {
          await whatsappService.sendInvoiceMessage('+91' + selfNum, payload);
        }
      }
    } catch (whatsappError) {
      console.error('⚠️ WhatsApp notification failed, but booking was created:', whatsappError.message);
    }

    return savedBooking;
  }

  async normalizeBookingItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('At least one booking item is required');
    }

    const normalized = [];
    for (const row of items) {
      if (!row || !row.productId) {
        throw new Error('Each item must include productId');
      }

      const product = await productService.findById(row.productId);
      if (!product || !product.isActive) {
        throw new Error('Invalid or inactive product in booking items');
      }

      const quantity = toNumber(row.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error('quantity must be an integer >= 1');
      }

      let unitPrice;
      if (product.isDefault) {
        unitPrice = toNumber(row.unitPrice);
        if (Number.isNaN(unitPrice) || unitPrice < 0) {
          throw new Error('Default Tattoo product requires unitPrice >= 0');
        }
      } else {
        unitPrice = toNumber(product.basePrice);
      }

      normalized.push({
        productId: product._id,
        productName: product.name,
        quantity,
        unitPrice,
        lineTotal: Math.round(unitPrice * quantity * 100) / 100,
      });
    }

    return normalized;
  }

  normalizePayment(payment, itemTotal) {
    if (!payment || typeof payment !== 'object') {
      throw new Error('payment is required');
    }

    const cashAmount = toNumber(payment.cashAmount ?? 0);
    const upiAmount = toNumber(payment.upiAmount ?? 0);

    if (Number.isNaN(cashAmount) || Number.isNaN(upiAmount)) {
      throw new Error('cashAmount and upiAmount must be valid numbers');
    }
    if (cashAmount < 0 || upiAmount < 0) {
      throw new Error('cashAmount and upiAmount cannot be negative');
    }
    if (cashAmount === 0 && upiAmount === 0) {
      throw new Error('At least one payment amount must be greater than 0');
    }

    const totalAmount = Math.round((cashAmount + upiAmount) * 100) / 100;
    if (Math.abs(totalAmount - itemTotal) > 0.001) {
      throw new Error('Payment total must match items total');
    }

    let paymentMode = PAYMENT_MODES.SPLIT;
    if (cashAmount > 0 && upiAmount === 0) paymentMode = PAYMENT_MODES.CASH;
    if (upiAmount > 0 && cashAmount === 0) paymentMode = PAYMENT_MODES.UPI;

    return { cashAmount, upiAmount, totalAmount, paymentMode };
  }

  /**
   * Get all bookings with optional filters (branchId, startDate, endDate, pagination)
   * @param {Object} filters - { branchId?, startDate?, endDate?, page?, limit? }
   * @returns {Promise<{ bookings: Array, total: Number }>}
   */
  async getAllBookings(filters = {}) {
    const { branchId, startDate, endDate, page = 1, limit = 10 } = filters;
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;

    const query = {};
    if (branchId) query.branchId = branchId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate).setHours(0, 0, 0, 0);
      if (endDate) query.date.$lte = new Date(endDate).setHours(23, 59, 59, 999);
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('branchId', 'name branchNumber')
        .populate('userId', 'fullName phone email')
        .populate('items.productId', 'name isDefault isActive')
        .sort({ date: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Booking.countDocuments(query),
    ]);

    const enriched = bookings.map((booking) => ({
      ...booking,
      amount: booking.payment?.totalAmount ?? 0,
      paymentMethod:
        booking.payment?.paymentMode === PAYMENT_MODES.CASH
          ? PAYMENT_METHODS.CASH
          : booking.payment?.paymentMode === PAYMENT_MODES.UPI
            ? PAYMENT_METHODS.UPI
            : `${PAYMENT_METHODS.CASH} + ${PAYMENT_METHODS.UPI}`,
      reminderSent: !!booking.reminderSentAt,
    }));

    return { bookings: enriched, total };
  }

  async getBookingsByBranch(branchId, filters = {}) {
    return this.getAllBookings({ ...filters, branchId });
  }

  async getBookingsByEmployee(employeeId) {
    return Booking.find({ employeeId })
      .populate('branchId', 'name branchNumber')
      .populate('userId', 'fullName phone email')
      .populate('items.productId', 'name isDefault isActive')
      .sort({ date: -1 });
  }

  async findById(id) {
    return Booking.findById(id)
      .populate('branchId', 'name branchNumber')
      .populate('userId', 'fullName phone email')
      .populate('items.productId', 'name isDefault isActive');
  }

  async countBookings() {
    return Booking.countDocuments();
  }

  async countBookingsByBranch(branchId) {
    return Booking.countDocuments({ branchId });
  }
}

module.exports = new BookingService();

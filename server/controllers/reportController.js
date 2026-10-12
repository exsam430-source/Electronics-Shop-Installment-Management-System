const CashSale = require('../models/CashSale');
const InstallmentSale = require('../models/InstallmentSale');
const InstallmentSchedule = require('../models/InstallmentSchedule');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Commission = require('../models/Commission');
const CommissionPayment = require('../models/CommissionPayment');
const Return = require('../models/Return');
const Warranty = require('../models/Warranty');
const BusinessProfile = require('../models/BusinessProfile');

const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, saleType } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.$gte = new Date(new Date(startDate).setHours(0, 0, 0));
      dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    let cashSales = [];
    let installmentSales = [];

    if (!saleType || saleType === 'all' || saleType === 'cash') {
      cashSales = await CashSale.find(dateFilter.$gte ? { saleDate: dateFilter } : {})
        .populate('customerId', 'customerName mobileNumber customerId')
        .sort({ saleDate: -1 });
    }

    if (!saleType || saleType === 'all' || saleType === 'installment') {
      installmentSales = await InstallmentSale.find(dateFilter.$gte ? { saleDate: dateFilter } : {})
        .populate('customerId', 'customerName mobileNumber customerId')
        .sort({ saleDate: -1 });
    }

    const totalCash = cashSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalInst = installmentSales.reduce((acc, s) => acc + (s.totalSaleAmount || 0), 0);
    const totalProfit = cashSales.reduce((acc, s) => acc + (s.profit || 0), 0) +
                        installmentSales.reduce((acc, s) => acc + (s.profit || 0), 0);

    return res.json({
      success: true,
      summary: {
        totalRevenue: totalCash + totalInst,
        totalCashRevenue: totalCash,
        totalInstallmentRevenue: totalInst,
        totalProfit,
        cashSalesCount: cashSales.length,
        installmentSalesCount: installmentSales.length
      },
      cashSales,
      installmentSales
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCollectionReport = async (req, res) => {
  try {
    const { startDate, endDate, paymentType } = req.query;
    let query = {};
    if (paymentType && paymentType !== 'all') query.paymentType = paymentType;
    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59))
      };
    }

    const payments = await Payment.find(query)
      .populate('customerId', 'customerName mobileNumber customerId')
      .populate('receiptId', 'receiptNumber')
      .sort({ paymentDate: -1 });

    const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    return res.json({
      success: true,
      totalCollected,
      count: payments.length,
      payments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getStockReport = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('categoryId', 'categoryName')
      .populate('supplierId', 'supplierName')
      .sort({ categoryId: 1, productName: 1 });

    const totalStockUnits = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
    const totalStockValue = products.reduce((acc, p) => acc + ((p.stockQuantity || 0) * (p.purchasePrice || 0)), 0);
    const lowStockCount = products.filter(p => p.stockQuantity <= 2).length;

    return res.json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalStockUnits,
        totalStockValue,
        lowStockCount
      },
      products
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getProfitReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = {};
    if (startDate && endDate) {
      dateQuery.saleDate = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59))
      };
    }

    const cashSales = await CashSale.find(dateQuery);
    const instSales = await InstallmentSale.find(dateQuery);

    const cashProfit = cashSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const instProfit = instSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const expectedProfit = cashProfit + instProfit;

    const completedInstSales = instSales.filter(s => s.accountStatus === 'completed');
    const realizedProfit = cashProfit + completedInstSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const pendingProfit = expectedProfit - realizedProfit;

    return res.json({
      success: true,
      summary: {
        expectedProfit,
        realizedProfit,
        pendingProfit,
        cashSalesProfit: cashProfit,
        installmentSalesProfit: instProfit
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOutstandingReport = async () => {};

const getMonthlyBusinessSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const selMonth = month !== undefined ? parseInt(month, 10) : now.getMonth();
    const selYear = year !== undefined ? parseInt(year, 10) : now.getFullYear();

    const start = new Date(selYear, selMonth, 1, 0, 0, 0);
    const end = new Date(selYear, selMonth + 1, 0, 23, 59, 59, 999);

    const cashSales = await CashSale.find({ saleDate: { $gte: start, $lte: end } });
    const instSales = await InstallmentSale.find({ saleDate: { $gte: start, $lte: end } });
    const payments = await Payment.find({ paymentDate: { $gte: start, $lte: end } });
    const commissions = await Commission.find({ saleDate: { $gte: start, $lte: end } });
    const commPayments = await CommissionPayment.find({ paymentDate: { $gte: start, $lte: end } });

    const totalCashRevenue = cashSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalInstRevenue = instSales.reduce((acc, s) => acc + (s.totalSaleAmount || 0), 0);
    const totalRevenue = totalCashRevenue + totalInstRevenue;

    const totalCollections = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const expectedProfit = cashSales.reduce((acc, s) => acc + (s.profit || 0), 0) +
                           instSales.reduce((acc, s) => acc + (s.profit || 0), 0);

    const totalCommissionEarned = commissions.reduce((acc, c) => acc + (c.commissionAmount || 0), 0);
    const totalCommissionPaid = commPayments.reduce((acc, c) => acc + (c.amount || 0), 0);

    const profile = await BusinessProfile.findOne();

    return res.json({
      success: true,
      month: selMonth,
      year: selYear,
      shopName: profile ? profile.shopName : "MR SOLVER Electronics",
      summary: {
        totalRevenue,
        totalCashRevenue,
        totalInstRevenue,
        totalCollections,
        expectedProfit,
        totalCommissionEarned,
        totalCommissionPaid,
        cashSalesCount: cashSales.length,
        installmentSalesCount: instSales.length,
        paymentsCount: payments.length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSalesReport,
  getCollectionReport,
  getStockReport,
  getProfitReport,
  getMonthlyBusinessSummary
};

const Product = require('../models/Product');
const CashSale = require('../models/CashSale');
const InstallmentSale = require('../models/InstallmentSale');
const InstallmentSchedule = require('../models/InstallmentSchedule');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const CommissionPayment = require('../models/CommissionPayment');
const BusinessProfile = require('../models/BusinessProfile');

const getDateRange = (filter, startDate, endDate, month, year) => {
  const now = new Date();
  let start = null;
  let end = null;

  if (filter === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (filter === 'this_week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (filter === 'this_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (filter === 'custom' && startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else if (filter === 'month_year' && month !== undefined && year !== undefined) {
    start = new Date(parseInt(year, 10), parseInt(month, 10), 1, 0, 0, 0);
    end = new Date(parseInt(year, 10), parseInt(month, 10) + 1, 0, 23, 59, 59, 999);
  }

  return { start, end };
};

const getDashboardStats = async (req, res) => {
  try {
    const { filter = 'all', startDate, endDate, month, year } = req.query;
    const { start, end } = getDateRange(filter, startDate, endDate, month, year);

    const profile = await BusinessProfile.findOne();
    const lowStockThreshold = (profile && profile.lowStockThreshold) || 2;

    // Date queries
    const saleDateFilter = start && end ? { saleDate: { $gte: start, $lte: end } } : {};
    const paymentDateFilter = start && end ? { paymentDate: { $gte: start, $lte: end } } : {};
    const commissionDateFilter = start && end ? { saleDate: { $gte: start, $lte: end } } : {};

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Inventory Overview (Always live)
    const totalProducts = await Product.countDocuments({ isActive: true });
    const availableStockAgg = await Product.aggregate([
      { $match: { isActive: true, productStatus: 'available' } },
      { $group: { _id: null, total: { $sum: '$stockQuantity' } } }
    ]);
    const availableStock = availableStockAgg[0] ? availableStockAgg[0].total : 0;
    const lowStockItems = await Product.countDocuments({
      isActive: true,
      stockQuantity: { $lte: lowStockThreshold }
    });

    // 2. Sales Overview
    const cashSales = await CashSale.find(saleDateFilter);
    const installmentSales = await InstallmentSale.find(saleDateFilter);

    const totalCashSaleAmount = cashSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalInstallmentSaleAmount = installmentSales.reduce((acc, s) => acc + (s.totalSaleAmount || 0), 0);
    const totalSalesAmount = totalCashSaleAmount + totalInstallmentSaleAmount;

    // Today's Sales
    const todayCashSales = await CashSale.find({ saleDate: { $gte: todayStart, $lte: todayEnd } });
    const todayInstSales = await InstallmentSale.find({ saleDate: { $gte: todayStart, $lte: todayEnd } });
    const todaySalesAmount = todayCashSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0) +
                             todayInstSales.reduce((acc, s) => acc + (s.totalSaleAmount || 0), 0);

    // Monthly Sales
    const monthCashSales = await CashSale.find({ saleDate: { $gte: monthStart, $lte: monthEnd } });
    const monthInstSales = await InstallmentSale.find({ saleDate: { $gte: monthStart, $lte: monthEnd } });
    const monthlySalesAmount = monthCashSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0) +
                               monthInstSales.reduce((acc, s) => acc + (s.totalSaleAmount || 0), 0);

    // 3. Installment Account Overview
    const totalInstallmentAccounts = await InstallmentSale.countDocuments();
    const activeInstallmentAccounts = await InstallmentSale.countDocuments({ accountStatus: 'active' });
    const completedAccounts = await InstallmentSale.countDocuments({ accountStatus: 'completed' });
    
    // Check overdue accounts
    const now = new Date();
    const overdueSchedules = await InstallmentSchedule.find({
      dueDate: { $lt: now },
      paymentStatus: { $in: ['pending', 'partial', 'overdue'] }
    }).distinct('installmentSaleId');
    const overdueAccounts = overdueSchedules.length;

    // 4. Payment Collections
    const filteredPayments = await Payment.find(paymentDateFilter);
    const totalCollectionsInFilter = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const todayPayments = await Payment.find({ paymentDate: { $gte: todayStart, $lte: todayEnd } });
    const todayCollections = todayPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const monthPayments = await Payment.find({ paymentDate: { $gte: monthStart, $lte: monthEnd } });
    const monthlyCollections = monthPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const allPaymentsAgg = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCollectionsAllTime = allPaymentsAgg[0] ? allPaymentsAgg[0].total : 0;

    // 5. Outstanding Balances
    const activeAccounts = await InstallmentSale.find({
      accountStatus: { $in: ['active', 'overdue'] }
    });
    const totalOutstandingBalance = activeAccounts.reduce((acc, s) => acc + (s.totalRemainingBalance || 0), 0);

    // Monthly Installments Due (in current month)
    const monthDueSchedules = await InstallmentSchedule.find({
      dueDate: { $gte: monthStart, $lte: monthEnd },
      paymentStatus: { $ne: 'paid' }
    });
    const monthlyInstallmentsDue = monthDueSchedules.reduce((acc, s) => acc + (s.remainingAmount || 0), 0);

    // Overdue Installment Amount
    const overdueScheduleDocs = await InstallmentSchedule.find({
      dueDate: { $lt: now },
      paymentStatus: { $in: ['pending', 'partial', 'overdue'] }
    });
    const overdueInstallmentAmount = overdueScheduleDocs.reduce((acc, s) => acc + (s.remainingAmount || 0), 0);
    const pendingInstallmentsCount = await InstallmentSchedule.countDocuments({
      paymentStatus: { $in: ['pending', 'partial', 'overdue'] }
    });

    // 6. Profit Overview (Expected, Realized, Pending)
    // Expected Profit = Sum of profit for all sales in filter
    const cashProfit = cashSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const instProfit = installmentSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const expectedProfit = cashProfit + instProfit;

    // Realized Profit: Cash sales profit + profit of completed installment accounts
    const completedInstSalesInFilter = installmentSales.filter(s => s.accountStatus === 'completed');
    const realizedProfit = cashProfit + completedInstSalesInFilter.reduce((acc, s) => acc + (s.profit || 0), 0);
    const pendingProfit = expectedProfit - realizedProfit;

    // Today's Profit
    const todayCashProfit = todayCashSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const todayInstProfit = todayInstSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const todayProfit = todayCashProfit + todayInstProfit;

    // Monthly Profit
    const monthCashProfit = monthCashSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const monthInstProfit = monthInstSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const monthlyProfit = monthCashProfit + monthInstProfit;

    // 7. Commission Overview
    const allCommissions = await Commission.find(commissionDateFilter);
    const totalCommissionEarned = allCommissions.reduce((acc, c) => acc + (c.commissionAmount || 0), 0);
    
    const allCommPayments = await CommissionPayment.find(paymentDateFilter);
    const totalCommissionPaid = allCommPayments.reduce((acc, c) => acc + (c.amount || 0), 0);
    const remainingCommissionPayable = Math.max(0, totalCommissionEarned - totalCommissionPaid);

    const monthCommissions = await Commission.find({ saleDate: { $gte: monthStart, $lte: monthEnd } });
    const monthlyCommissionEarned = monthCommissions.reduce((acc, c) => acc + (c.commissionAmount || 0), 0);

    return res.json({
      success: true,
      filterApplied: { filter, startDate, endDate, month, year },
      inventory: {
        totalProducts,
        availableStock,
        lowStockItems,
        lowStockThreshold
      },
      sales: {
        totalSales: totalSalesAmount,
        cashSalesAmount: totalCashSaleAmount,
        installmentSalesAmount: totalInstallmentSaleAmount,
        cashSalesCount: cashSales.length,
        installmentSalesCount: installmentSales.length,
        todaySales: todaySalesAmount,
        monthlySales: monthlySalesAmount
      },
      installments: {
        totalInstallmentAccounts,
        activeInstallmentAccounts,
        completedAccounts,
        overdueAccounts
      },
      collections: {
        filteredCollections: totalCollectionsInFilter,
        todayCollections,
        monthlyCollections,
        totalCollectionsAllTime
      },
      outstanding: {
        totalOutstandingBalance,
        monthlyInstallmentsDue,
        overdueInstallmentAmount,
        pendingInstallmentsCount
      },
      profit: {
        expectedProfit,
        realizedProfit,
        pendingProfit,
        todayProfit,
        monthlyProfit
      },
      commissions: {
        totalCommissionEarned,
        totalCommissionPaid,
        remainingCommissionPayable,
        monthlyCommissionEarned
      }
    });
  } catch (error) {
    console.error('[Dashboard Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };

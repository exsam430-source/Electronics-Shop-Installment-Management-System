const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const ReferralPartner = require('../models/ReferralPartner');
const Purchase = require('../models/Purchase');
const CashSale = require('../models/CashSale');
const InstallmentSale = require('../models/InstallmentSale');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const CommissionPayment = require('../models/CommissionPayment');
const Return = require('../models/Return');

const padZero = (num, size) => {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
};

const getYearPrefix = () => {
  return new Date().getFullYear().toString();
};

const generateProductId = async () => {
  const count = await Product.countDocuments();
  return `PRD-${padZero(count + 1, 4)}`;
};

const generateSupplierId = async () => {
  const count = await Supplier.countDocuments();
  return `SUP-${padZero(count + 1, 3)}`;
};

const generateCustomerId = async () => {
  const count = await Customer.countDocuments();
  return `CUST-${padZero(count + 1, 4)}`;
};

const generatePartnerId = async () => {
  const count = await ReferralPartner.countDocuments();
  return `REF-${padZero(count + 1, 3)}`;
};

const generatePurchaseId = async () => {
  const count = await Purchase.countDocuments();
  return `PUR-${getYearPrefix()}${padZero(count + 1, 4)}`;
};

const generateCashSaleId = async () => {
  const count = await CashSale.countDocuments();
  return `CS-${getYearPrefix()}${padZero(count + 1, 4)}`;
};

const generateInstallmentSaleId = async () => {
  const count = await InstallmentSale.countDocuments();
  return `IS-${getYearPrefix()}${padZero(count + 1, 4)}`;
};

const generatePaymentId = async () => {
  const count = await Payment.countDocuments();
  return `PAY-${getYearPrefix()}${padZero(count + 1, 4)}`;
};

const generateReceiptId = async () => {
  const count = await Receipt.countDocuments();
  return `REC-${padZero(count + 1, 6)}`;
};

const generateCommissionPaymentId = async () => {
  const count = await CommissionPayment.countDocuments();
  return `CPAY-${getYearPrefix()}${padZero(count + 1, 4)}`;
};

const generateReturnId = async () => {
  const count = await Return.countDocuments();
  return `RET-${getYearPrefix()}${padZero(count + 1, 4)}`;
};

module.exports = {
  generateProductId,
  generateSupplierId,
  generateCustomerId,
  generatePartnerId,
  generatePurchaseId,
  generateCashSaleId,
  generateInstallmentSaleId,
  generatePaymentId,
  generateReceiptId,
  generateCommissionPaymentId,
  generateReturnId
};

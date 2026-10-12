const Customer = require('../models/Customer');
const CashSale = require('../models/CashSale');
const InstallmentSale = require('../models/InstallmentSale');
const Payment = require('../models/Payment');
const { generateCustomerId } = require('../utils/idGenerator');
const { logActivity } = require('../middleware/activityLogger');

const getCustomers = async (req, res) => {
  try {
    const { search, hasBalance } = req.query;
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { customerName: new RegExp(search, 'i') },
        { customerId: new RegExp(search, 'i') },
        { mobileNumber: new RegExp(search, 'i') },
        { cnic: new RegExp(search, 'i') }
      ];
    }

    if (hasBalance === 'true') {
      query.outstandingBalance = { $gt: 0 };
    }

    const customers = await Customer.find(query)
      .populate('referralPartnerId', 'partnerName partnerCode')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('referralPartnerId', 'partnerName partnerCode commissionRate');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const cashSales = await CashSale.find({ customerId: customer._id }).sort({ saleDate: -1 });
    const installmentSales = await InstallmentSale.find({ customerId: customer._id }).sort({ saleDate: -1 });
    const payments = await Payment.find({ customerId: customer._id }).sort({ paymentDate: -1 });

    return res.json({
      success: true,
      data: customer,
      history: {
        cashSales,
        installmentSales,
        payments
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const {
      customerName,
      mobileNumber,
      whatsappNumber,
      cnic,
      address,
      guarantorName,
      guarantorMobile,
      referralPartnerId
    } = req.body;

    if (!customerName || !mobileNumber) {
      return res.status(400).json({ success: false, message: 'Customer name and mobile number are required.' });
    }

    const customerId = await generateCustomerId();
    const finalWhatsApp = whatsappNumber && whatsappNumber.trim() ? whatsappNumber.trim() : mobileNumber.trim();

    const customer = await Customer.create({
      customerId,
      customerName: customerName.trim(),
      mobileNumber: mobileNumber.trim(),
      whatsappNumber: finalWhatsApp,
      cnic: cnic ? cnic.trim() : "",
      address: address || "",
      guarantorName: guarantorName || "",
      guarantorMobile: guarantorMobile || "",
      referralPartnerId: referralPartnerId || null
    });

    await logActivity(req, 'create', 'customer', `Created customer ${customer.customerName} (${customerId})`, customer._id);

    return res.status(201).json({ success: true, data: customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const {
      customerName,
      mobileNumber,
      whatsappNumber,
      cnic,
      address,
      guarantorName,
      guarantorMobile,
      referralPartnerId
    } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    if (customerName) customer.customerName = customerName.trim();
    if (mobileNumber) customer.mobileNumber = mobileNumber.trim();
    if (whatsappNumber !== undefined) customer.whatsappNumber = whatsappNumber.trim();
    if (cnic !== undefined) customer.cnic = cnic.trim();
    if (address !== undefined) customer.address = address;
    if (guarantorName !== undefined) customer.guarantorName = guarantorName;
    if (guarantorMobile !== undefined) customer.guarantorMobile = guarantorMobile;
    if (referralPartnerId !== undefined) customer.referralPartnerId = referralPartnerId || null;

    await customer.save();
    await logActivity(req, 'update', 'customer', `Updated customer ${customer.customerName}`, customer._id);

    return res.json({ success: true, data: customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer
};

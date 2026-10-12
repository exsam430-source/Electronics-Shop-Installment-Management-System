const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const { generateSupplierId } = require('../utils/idGenerator');
const { logActivity } = require('../middleware/activityLogger');

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ supplierName: 1 });
    return res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    const purchases = await Purchase.find({ supplierId: supplier._id }).sort({ purchaseDate: -1 });

    return res.json({ success: true, data: supplier, purchases });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    const { supplierName, contactPerson, phone, mobile, address, city, initialBalance = 0 } = req.body;
    if (!supplierName || !phone) {
      return res.status(400).json({ success: false, message: 'Supplier name and phone are required.' });
    }

    const supplierCode = await generateSupplierId();
    const supplier = await Supplier.create({
      supplierCode,
      supplierName: supplierName.trim(),
      contactPerson: contactPerson || "",
      phone: phone.trim(),
      mobile: mobile ? mobile.trim() : "",
      address: address || "",
      city: city || "",
      balance: Number(initialBalance) || 0
    });

    await logActivity(req, 'create', 'supplier', `Created supplier ${supplier.supplierName} (${supplierCode})`, supplier._id);

    return res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { supplierName, contactPerson, phone, mobile, address, city } = req.body;
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    if (supplierName) supplier.supplierName = supplierName.trim();
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
    if (phone) supplier.phone = phone.trim();
    if (mobile !== undefined) supplier.mobile = mobile;
    if (address !== undefined) supplier.address = address;
    if (city !== undefined) supplier.city = city;

    await supplier.save();
    await logActivity(req, 'update', 'supplier', `Updated supplier ${supplier.supplierName}`, supplier._id);

    return res.json({ success: true, data: supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Record payment made to supplier
const paySupplier = async (req, res) => {
  try {
    const { amount, notes, paymentMethod = 'cash' } = req.body;
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount required.' });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    supplier.balance = Math.max(0, supplier.balance - payAmt);
    await supplier.save();

    await logActivity(req, 'create', 'supplier', `Paid Rs. ${payAmt} to supplier ${supplier.supplierName}. Mode: ${paymentMethod}. Notes: ${notes}`, supplier._id);

    return res.json({ success: true, data: supplier, message: `Paid Rs. ${payAmt} successfully.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  paySupplier
};

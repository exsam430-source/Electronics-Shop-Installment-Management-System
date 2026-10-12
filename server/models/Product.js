const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: { type: String, required: true, unique: true }, // e.g. PRD-0001
  productName: { type: String, required: true, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, required: true, trim: true },
  modelNumber: { type: String, default: "" },
  description: { type: String, default: "" },
  purchasePrice: { type: Number, required: true, min: 0 },
  cashSalePrice: { type: Number, required: true, min: 0 },
  installmentSalePrice: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, default: 0, min: 0 },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  warrantyDuration: { type: Number, default: 0 }, // in months
  productStatus: { 
    type: String, 
    enum: ['available', 'out_of_stock', 'discontinued'], 
    default: 'available' 
  },
  purchaseDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ categoryId: 1, productStatus: 1 });
productSchema.index({ supplierId: 1 });

module.exports = mongoose.model('Product', productSchema);

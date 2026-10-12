require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const seedInitialData = require('./utils/seedData');
const { setupAutoBackupSchedule } = require('./utils/backupService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const customerRoutes = require('./routes/customerRoutes');
const referralPartnerRoutes = require('./routes/referralPartnerRoutes');
const cashSaleRoutes = require('./routes/cashSaleRoutes');
const installmentSaleRoutes = require('./routes/installmentSaleRoutes');
const installmentPaymentRoutes = require('./routes/installmentPaymentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const returnRoutes = require('./routes/returnRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const backupRoutes = require('./routes/backupRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads & client build (for production packaging or built offline distribution)
app.use('/data/uploads', express.static(path.join(process.cwd(), 'data', 'uploads')));
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/referral-partners', referralPartnerRoutes);
app.use('/api/sales/cash', cashSaleRoutes);
app.use('/api/sales/installment', installmentSaleRoutes);
app.use('/api/installments', installmentPaymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backups', backupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'MR SOLVER Electronics Shop & Installment Management System',
    timestamp: new Date().toISOString()
  });
});

// Production & Desktop SPA catch-all
if (fs.existsSync(distPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();
    await setupAutoBackupSchedule();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` MR SOLVER ELECTRONICS SHOP & INSTALLMENT SYSTEM`);
      console.log(` Backend API running on: http://localhost:${PORT}`);
      console.log(` Fully Offline Desktop Server Active`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('[Server Startup Failed]:', error.message);
    process.exit(1);
  }
};

startServer();

const Category = require('../models/Category');
const BusinessProfile = require('../models/BusinessProfile');
const Settings = require('../models/Settings');

const PRELOADED_CATEGORIES = [
  "Refrigerators",
  "Freezers",
  "Air Conditioners",
  "Washing Machines",
  "LED / Smart TVs",
  "Deep Freezers",
  "Microwave Ovens",
  "Water Dispensers",
  "Electric Ovens",
  "Room Coolers",
  "Fans",
  "Inverters",
  "Batteries",
  "Geysers",
  "Vacuum Cleaners",
  "Mobile Phones",
  "Other Electronic Appliances"
];

const seedInitialData = async () => {
  try {
    // 1. Seed Categories if empty
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('[Seed] Seeding 17 pre-loaded electronic product categories...');
      const docs = PRELOADED_CATEGORIES.map((cat, index) => ({
        categoryName: cat,
        description: `Electronics & Home Appliances - ${cat}`,
        isActive: true,
        isDefault: true,
        sortOrder: index + 1
      }));
      await Category.insertMany(docs);
      console.log('[Seed] Successfully seeded categories.');
    }

    // 2. Seed Business Profile if empty
    const profileCount = await BusinessProfile.countDocuments();
    if (profileCount === 0) {
      console.log('[Seed] Seeding initial Business Profile...');
      await BusinessProfile.create({
        shopName: "MR SOLVER ELECTRONICS & APPLIANCES",
        ownerName: "MR SOLVER",
        address: "Main Commercial Center, Electronics Hub",
        city: "Lahore",
        phone: "+92 42 30000000",
        mobile: "+92 300 1234567",
        email: "support@mrsolver.com",
        receiptHeader: "Quality Guaranteed • Easy Monthly Installments • Authorized Dealer",
        receiptFooter: "Thank you for choosing us! Electronics items warranty per manufacturer terms.",
        defaultCommissionRate: 1,
        currency: "Rs.",
        lowStockThreshold: 2,
        printerType: "thermal_80",
        lateFeeSettings: {
          enabled: false,
          type: "fixed",
          amount: 500,
          percentage: 2,
          graceDays: 10,
          frequency: "once"
        },
        autoBackup: {
          enabled: true,
          frequency: "weekly",
          day: "Monday",
          time: "23:00",
          keepLast: 12,
          backupPath: "data/backups"
        }
      });
      console.log('[Seed] Business Profile seeded.');
    }

    // 3. Seed default Settings
    const defaultSettings = [
      { key: "dateFormat", value: "DD/MM/YYYY", category: "general", description: "Display date format" },
      { key: "enableSound", value: true, category: "general", description: "Play sound on scan/success" },
      { key: "autoPrintReceipt", value: false, category: "receipt", description: "Direct print without preview" },
      { key: "whatsappEnabled", value: true, category: "notification", description: "Enable WhatsApp direct web/app triggers" }
    ];

    for (const setting of defaultSettings) {
      const exists = await Settings.findOne({ key: setting.key });
      if (!exists) {
        await Settings.create(setting);
      }
    }
  } catch (error) {
    console.error('[Seed Error]:', error.message);
  }
};

module.exports = seedInitialData;

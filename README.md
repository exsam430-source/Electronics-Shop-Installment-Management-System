# MR SOLVER Electronics Shop & Installment Management System

A modern electronics retail and installment management solution built with React, Express, MongoDB, and Electron. It is designed for stores that sell appliances and electronics, track purchases and inventory, manage credit sales, and automate daily business operations from a single dashboard.

## Project Name

MR SOLVER Electronics Shop & Installment Management System

## Short Description (about 350 characters)

MR SOLVER Electronics Shop & Installment Management System is a complete retail management platform for electronics businesses. It helps store owners manage product inventory, supplier purchases, customer sales, installment accounts, payment collection, returns, commissions, backups, receipts, and financial reports from one dashboard. It is built to support fast daily operations, maintain accurate records, and provide reliable business visibility for both cash and credit-based sales in a simple, secure, and professional environment.

## Overview

This project combines a backend API, a frontend dashboard, and a desktop application wrapper. It is suitable for electronics shops, appliance stores, and installment-based retail businesses that need a structured system for selling products, collecting payments, and monitoring account health.

The application includes:

- Product catalog and category management
- Supplier and purchase tracking
- Cash sales and installment sales
- Customer account management
- Payment collection and overdue tracking
- Receipts and return processing
- Referral partner records and commission tracking
- Dashboard analytics and reports
- Backup and settings configuration
- Secure admin login and setup workflow

## Features

### Inventory and Product Management
- Add, edit, update, and view products
- Organize products into categories
- Track low-stock conditions
- Manage pricing, model details, and product metadata
- Support product images and shop branding assets

### Supplier and Purchase Workflow
- Manage suppliers and supplier transactions
- Record purchases from vendors
- Track goods added to inventory
- Keep purchase history for financial review

### Sales Management
- Cash sale entry for immediate sales
- Installment sales with payment schedules
- Customer credit account tracking
- Due-date monitoring and account progress
- Overdue installment identification

### Payment and Receipts
- Record installment payments
- View payment history
- Generate receipts for transactions
- Monitor customer outstanding balances
- Support printing-friendly receipt workflows

### Customer and Partner Management
- Create and manage customer records
- Maintain customer purchase and payment history
- Track referral partners
- Calculate and monitor commission activity

### Dashboard and Reporting
- Real-time summary cards for business performance
- Daily, weekly, monthly, and custom date filters
- Financial and sales insights
- Report hub for monitoring business health
- Data summary for operational decisions

### Business Operations
- Setup wizard for first-time configuration
- Automatic seed data for initial categories and profile
- Backup scheduling and management
- Preferences and system settings
- WhatsApp and printing integration support

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Routing: React Router
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Desktop app: Electron
- Authentication: JWT + bcrypt
- File upload: Multer
- Scheduling: node-cron

## Project Structure

```text
electronics-shop-manager/
├── src/                     # React frontend
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server/                  # Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── index.js
├── data/                    # Local app data and backups
│   ├── backups/
│   ├── db/
│   └── uploads/
├── public/                  # Static public assets
├── dist/                    # Production frontend build
├── release/                 # Electron build output
├── package.json
├── .gitignore
├── index.html
├── main.js
├── vite.config.js
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

## Prerequisites

Before running this project, make sure you have:

- Node.js 18 or newer
- npm or yarn
- MongoDB installed and running locally or a reachable MongoDB URI
- Git (optional but recommended)

## Installation

1. Clone the repository:

```bash
git clone <your-repository-url>
cd electronics-shop-manager
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/electronics_shop_db
JWT_SECRET=your_super_secret_key
```

4. Start MongoDB locally if it is not already running.

5. Run the application in development mode:

```bash
npm run dev
```

This command starts the Express server and the Vite frontend together.

## Available Scripts

```bash
npm run dev            # Start backend + frontend together
npm run dev:server     # Start only the backend API
npm run dev:client     # Start only the frontend dev server
npm run build:client   # Build the frontend for production
npm start             # Start production backend server
npm run electron:dev   # Start backend + frontend + Electron app
npm run electron       # Launch Electron app
npm run dist           # Build frontend and package desktop app
```

## Running the Desktop App

To run the project as an Electron desktop app:

```bash
npm run electron:dev
```

This opens the app in desktop mode while the backend and frontend are running together.

## Environment Configuration

The application uses a `.env` file for configuration. Example values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/electronics_shop_db
JWT_SECRET=change_this_to_a_secure_secret
```

You may also set custom database credentials or server configuration as needed for your environment.

## API Overview

The backend exposes routes under the `/api` namespace, including:

- `/api/auth` - login and authentication
- `/api/dashboard` - statistics and dashboard metrics
- `/api/products` - product management
- `/api/categories` - category management
- `/api/suppliers` - supplier records
- `/api/purchases` - purchase history and entry
- `/api/customers` - customer records
- `/api/referral-partners` - referral partner management
- `/api/sales/cash` - cash sales
- `/api/sales/installment` - installment sales
- `/api/installments` - installment payment and account actions
- `/api/payments` - payment operations
- `/api/receipts` - receipt generation
- `/api/returns` - return handling
- `/api/reports` - business summaries and reports
- `/api/settings` - app settings
- `/api/backups` - backup management

## Security Notes

- Use a strong JWT secret in production
- Protect local MongoDB access
- Do not commit `.env` files to source control
- Store business and customer data securely
- Use a secured server environment before production deployment

## Backup and Data Management

The system includes support for:

- Local backup creation
- Backup scheduling
- Upload storage for shop branding and product assets
- Business profile and settings persistence
- Offline-ready local operations for desktop use

## License

This project is licensed under the ISC License.

## Developer Note

This is a complete business management system for an electronics retail store, built to help operations remain organized, fast, and traceable. It is particularly useful for stores that combine direct cash sales with installment-based customer financing and need a single platform to manage data, finances, and reporting.

## Future Enhancements

Possible future improvements include:

- Multi-user role and permission management
- Advanced barcode scanning support
- Sales forecasting and analytics
- PDF receipt export
- Print server integration
- Light/dark theme personalization
- Cloud deployment support
- Automated notification integrations

## Conclusion

MR SOLVER Electronics Shop & Installment Management System is designed to streamline retail operations for modern electronics and appliance businesses. With strong inventory controls, installment tracking, reporting, and backup management, it gives store owners a reliable tool for daily business decisions and long-term growth.

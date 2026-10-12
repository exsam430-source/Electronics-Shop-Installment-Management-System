import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import AppLayout from './components/Layout/AppLayout';

// Pages
import SetupWizard from './pages/Setup/SetupWizard';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';

import ProductList from './pages/Products/ProductList';
import ProductForm from './pages/Products/ProductForm';
import CategoryManager from './pages/Categories/CategoryManager';

import SupplierList from './pages/Suppliers/SupplierList';
import PurchaseList from './pages/Suppliers/PurchaseList';
import PurchaseForm from './pages/Suppliers/PurchaseForm';

import CustomerList from './pages/Customers/CustomerList';
import CustomerForm from './pages/Customers/CustomerForm';

import PartnerList from './pages/ReferralPartners/PartnerList';

import NewCashSale from './pages/Sales/NewCashSale';
import CashSaleHistory from './pages/Sales/CashSaleHistory';
import NewInstallmentSale from './pages/Sales/NewInstallmentSale';

import ActiveAccounts from './pages/Installments/ActiveAccounts';
import InstallmentAccountDetail from './pages/Installments/InstallmentAccountDetail';
import OverdueInstallments from './pages/Installments/OverdueInstallments';
import CompletedAccounts from './pages/Installments/CompletedAccounts';

import PaymentList from './pages/Payments/PaymentList';
import ReceiptList from './pages/Receipts/ReceiptList';
import ReturnList from './pages/Returns/ReturnList';
import ReportsHub from './pages/Reports/ReportsHub';
import Settings from './pages/Settings/Settings';

const ProtectedRoute = ({ children }) => {
  const { user, token, loading, needsSetup } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        Loading System Environment...
      </div>
    );
  }

  if (needsSetup) {
    return <Navigate to="/setup" replace />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  const { needsSetup, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        Starting Offline Management Engine...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public / Setup Routes */}
      <Route path="/setup" element={needsSetup ? <SetupWizard /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Management Routes inside Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Products */}
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
        <Route path="categories" element={<CategoryManager />} />

        {/* Suppliers & Purchases */}
        <Route path="suppliers" element={<SupplierList />} />
        <Route path="purchases" element={<PurchaseList />} />
        <Route path="purchases/new" element={<PurchaseForm />} />

        {/* Customers */}
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />

        {/* Referral Partners */}
        <Route path="referral-partners" element={<PartnerList />} />

        {/* Sales */}
        <Route path="sales/cash" element={<CashSaleHistory />} />
        <Route path="sales/cash/new" element={<NewCashSale />} />
        <Route path="sales/installment" element={<ActiveAccounts />} />
        <Route path="sales/installment/new" element={<NewInstallmentSale />} />

        {/* Installment Accounts */}
        <Route path="installments" element={<ActiveAccounts />} />
        <Route path="installments/:id" element={<InstallmentAccountDetail />} />
        <Route path="installments/overdue" element={<OverdueInstallments />} />
        <Route path="installments/completed" element={<CompletedAccounts />} />

        {/* Payments, Receipts, Returns */}
        <Route path="payments" element={<PaymentList />} />
        <Route path="receipts" element={<ReceiptList />} />
        <Route path="returns" element={<ReturnList />} />

        {/* Reports & System Settings */}
        <Route path="reports" element={<ReportsHub />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

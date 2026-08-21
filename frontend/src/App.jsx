import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { ToastProvider } from './components/ToastContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardOverview from './pages/DashboardOverview';
import ShopsPage from './pages/ShopsPage';
import LicensesPage from './pages/LicensesPage';
import PackagesPage from './pages/PackagesPage';
import MachinesPage from './pages/MachinesPage';
import PaymentsPage from './pages/PaymentsPage';
import AuditLogsPage from './pages/AuditLogsPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('estore_admin_token');
  });

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
                )
              }
            />

            <Route
              element={
                isAuthenticated ? (
                  <Layout onLogout={() => setIsAuthenticated(false)} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            >
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/shops" element={<ShopsPage />} />
              <Route path="/licenses" element={<LicensesPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/machines" element={<MachinesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

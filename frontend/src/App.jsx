import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { ToastProvider } from './components/ToastContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardOverview from './pages/DashboardOverview';
import ActivityCenterPage from './pages/ActivityCenterPage';
import OrganizationsPage from './pages/OrganizationsPage';
import ShopsPage from './pages/ShopsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import PaymentsPage from './pages/PaymentsPage';
import LicensesPage from './pages/LicensesPage';
import MachinesPage from './pages/MachinesPage';
import FeatureFlagsPage from './pages/FeatureFlagsPage';
import ReleasesPage from './pages/ReleasesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SupportPage from './pages/SupportPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import MonitoringPage from './pages/MonitoringPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';

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
              {/* Platform Overview */}
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/activity" element={<ActivityCenterPage />} />

              {/* Tenants & Monetization */}
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/shops" element={<ShopsPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />

              {/* Licensing & Hardware */}
              <Route path="/licenses" element={<LicensesPage />} />
              <Route path="/machines" element={<MachinesPage />} />

              {/* Product & Rollout */}
              <Route path="/feature-flags" element={<FeatureFlagsPage />} />
              <Route path="/releases" element={<ReleasesPage />} />

              {/* Intelligence & Support */}
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />

              {/* Operations & Security */}
              <Route path="/monitoring" element={<MonitoringPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

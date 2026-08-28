import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './components/ThemeContext';
import { ToastProvider } from './components/ToastContext';
import Layout from './components/Layout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardOverview = lazy(() => import('./pages/DashboardOverview'));
const ActivityCenterPage = lazy(() => import('./pages/ActivityCenterPage'));
const OrganizationsPage = lazy(() => import('./pages/OrganizationsPage'));
const ShopsPage = lazy(() => import('./pages/ShopsPage'));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const LicensesPage = lazy(() => import('./pages/LicensesPage'));
const MachinesPage = lazy(() => import('./pages/MachinesPage'));
const FeatureFlagsPage = lazy(() => import('./pages/FeatureFlagsPage'));
const ReleasesPage = lazy(() => import('./pages/ReleasesPage'));
const IndustryTemplatesPage = lazy(() => import('./pages/IndustryTemplatesPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const MonitoringPage = lazy(() => import('./pages/MonitoringPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] w-full">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-500 opacity-60" />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('estore_admin_token');
  });

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoader />}>
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
                <Route path="/industry-templates" element={<IndustryTemplatesPage />} />
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
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

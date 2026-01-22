import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ModulePlaceholder from './components/ModulePlaceholder';
import LoginPage from './pages/LoginPage';
import PublicDemoViewer from './pages/PublicDemoViewer';
import PublicBookingPage from './pages/PublicBookingPage';
import Unsubscribe from './pages/Unsubscribe';
import Dashboard from './pages/Dashboard';

// Module Imports
import EmailControl from './modules/marketing/email-control/EmailControl';
import Prospects from './modules/sales/prospects/Prospects';
import Outreach from './modules/sales/outreach/Outreach';
import VendorPartnerManager from './modules/sales/vendors/VendorPartnerManager';
import DemoManager from './modules/sales/demos/DemoManager';
import ProposalBuilder from './modules/sales/proposals/ProposalBuilder';
import SequenceManager from './modules/sales/sequences/SequenceManager';
import SalesAdmin from './modules/sales/admin/SalesAdmin';
import UnifiedScheduler from './modules/ops/scheduler/UnifiedScheduler';
import ContentAmplification from './modules/marketing/amplify/ContentAmplification';
import AICoachTuner from './modules/coaching/ai-coach/AICoachTuner';
import GoalTemplates from './modules/coaching/goals/GoalTemplates';
import FeatureLab from './modules/product/feature-lab/FeatureLab'; 
import IntegrationHub from './modules/integration/hub/IntegrationHub';
import LeaderAnalytics from './modules/analytics/LeaderAnalytics';

// Sprint 2 Imports - New Modules
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import TeamManagement from './modules/ops/team/TeamManagement';
import RevenueForecasting from './modules/analytics/RevenueForecasting';
import DocumentLibrary from './modules/sales/documents/DocumentLibrary';
import MeetingNotes from './modules/sales/activities/MeetingNotes';
import EmailTemplates from './modules/marketing/EmailTemplates';
import WorkflowAutomation from './modules/ops/WorkflowAutomation';
import ClientPortal from './modules/sales/portal/ClientPortal';
import CompetitiveIntel from './modules/marketing/CompetitiveIntel';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthorized } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corporate-teal"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/view/:demoId" element={<PublicDemoViewer />} />
      <Route path="/book/:userId" element={<PublicBookingPage />} />
      <Route path="/unsubscribe" element={<Unsubscribe />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ExecutiveDashboard />} />
        
        {/* Sales Enablement */}
        <Route path="sales">
            <Route path="admin" element={<SalesAdmin />} />
            <Route path="prospects" element={<Prospects />} />
            <Route path="outreach" element={<Outreach />} />
            <Route path="vendors" element={<VendorPartnerManager />} />
            <Route path="demos" element={<DemoManager />} />
            <Route path="proposals" element={<ProposalBuilder />} />
            <Route path="sequences" element={<SequenceManager />} />
            <Route path="documents" element={<DocumentLibrary />} />
            <Route path="activities" element={<MeetingNotes />} />
            <Route path="portal" element={<ClientPortal />} />
        </Route>

        {/* Marketing */}
        <Route path="marketing">
            <Route path="email-health" element={<EmailControl />} />
            <Route path="amplify" element={<ContentAmplification />} />
            <Route path="templates" element={<EmailTemplates />} />
            <Route path="competitors" element={<CompetitiveIntel />} />
        </Route>

        {/* Operations */}
        <Route path="ops">
            <Route path="scheduler" element={<UnifiedScheduler />} />
            <Route path="integrations" element={<IntegrationHub />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="workflows" element={<WorkflowAutomation />} />
        </Route>

        {/* Product */}
        <Route path="product">
             <Route path="lab" element={<FeatureLab />} />
        </Route>

        {/* Coaching */}
        <Route path="coaching">
            <Route path="ai" element={<AICoachTuner />} />
            <Route path="goals" element={<GoalTemplates />} />
        </Route>

        {/* Analytics */}
        <Route path="analytics">
            <Route path="leaders" element={<LeaderAnalytics />} />
            <Route path="revenue" element={<RevenueForecasting />} />
            <Route path="pipeline" element={<LeaderAnalytics />} />
        </Route>

        {/* Legacy Dashboard Route */}
        <Route path="dashboard" element={<Dashboard />} />

        {/* Redirects for legacy routes */}
        <Route path="prospects" element={<Navigate to="/sales/prospects" replace />} />
        <Route path="vendors" element={<Navigate to="/sales/vendors" replace />} />
        <Route path="demos" element={<Navigate to="/sales/demos" replace />} />
        <Route path="sequences" element={<Navigate to="/sales/sequences" replace />} />
        <Route path="scheduler" element={<Navigate to="/ops/scheduler" replace />} />
        <Route path="lab" element={<Navigate to="/product/lab" replace />} />

        {/* Catch-all - Redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

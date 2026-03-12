import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import EncyclopediaPage from './pages/EncyclopediaPage';
import GuidePage from './pages/GuidePage';
import CalibrationPage from './pages/CalibrationPage';
import FieldGuidePage from './pages/FieldGuidePage';
import AdvisorPage from './pages/AdvisorPage';
import ComparePage from './pages/ComparePage';
import GlossaryPage from './pages/GlossaryPage';
import QuickReferencePage from './pages/QuickReferencePage';
import ProfilesPage from './pages/ProfilesPage';
import LoginPage from './pages/LoginPage';
import AssessmentPage from './pages/AssessmentPage';
import AssessmentResultPage from './pages/AssessmentResultPage';
import CoachingPage from './pages/CoachingPage';
import ProfilerPage from './pages/ProfilerPage';
import FeedbackAdminPage from './pages/FeedbackAdminPage';
import LoadingScreen from './components/LoadingScreen';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<AuthWrapper />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/profiles" element={<ProtectedRoute><ProfilesPage /></ProtectedRoute>} />
          <Route path="/encyclopedia" element={<ProtectedRoute><EncyclopediaPage /></ProtectedRoute>} />
          <Route path="/guide" element={<ProtectedRoute><GuidePage /></ProtectedRoute>} />
          <Route path="/calibration" element={<ProtectedRoute><CalibrationPage /></ProtectedRoute>} />
          <Route path="/field-guide" element={<ProtectedRoute><FieldGuidePage /></ProtectedRoute>} />
          <Route path="/advisor" element={<ProtectedRoute><AdvisorPage /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
          <Route path="/glossary" element={<ProtectedRoute><GlossaryPage /></ProtectedRoute>} />
          <Route path="/quick-reference" element={<ProtectedRoute><QuickReferencePage /></ProtectedRoute>} />
          <Route path="/assessment" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
          <Route path="/assessment-result" element={<ProtectedRoute><AssessmentResultPage /></ProtectedRoute>} />
          <Route path="/coaching" element={<ProtectedRoute><CoachingPage /></ProtectedRoute>} />
          <Route path="/profiler" element={<ProtectedRoute><ProfilerPage /></ProtectedRoute>} />
          <Route path="/admin/feedback" element={<ProtectedRoute><FeedbackAdminPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function AuthWrapper() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return <LoginPage />;
}

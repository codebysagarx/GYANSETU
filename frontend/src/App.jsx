import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import AITutorPage from './pages/AITutorPage';
import DoubtsPage from './pages/DoubtsPage';
import DoubtDetailPage from './pages/DoubtDetailPage';
import QuizzesPage from './pages/QuizzesPage';
import NotesPage from './pages/NotesPage';
import MyLearningPage from './pages/MyLearningPage';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Standalone Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Routes with Sidebar, Header & Mobile Nav Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tutor" element={<AITutorPage />} />
              <Route path="/doubts" element={<DoubtsPage />} />
              <Route path="/doubts/:id" element={<DoubtDetailPage />} />
              <Route path="/quizzes" element={<QuizzesPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/my-learning" element={<MyLearningPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              
              {/* Faculty Admin Route */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

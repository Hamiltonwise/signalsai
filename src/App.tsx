import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazyWithRetry } from './utils/lazyWithRetry';
import SuspenseWithTimeout from './components/SuspenseWithTimeout';
import LazyBoundary from './components/LazyBoundary';
import Layout from './components/Layout';
import { ProtectedRoute, GuestRoute } from './routes/guards';
import { ClientProvider } from './contexts/ClientContext';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import OAuthCallback from './pages/OAuthCallback';
import SignOut from './pages/SignOut';
import Reviews from './pages/Reviews';
import Newsletter from './pages/Newsletter';

// Lazy load heavy pages for better initial load performance
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'), { retries: 2 });
const TeamTasks = lazyWithRetry(() => import('./pages/TeamTasks'), { retries: 2 });
const Upload = lazyWithRetry(() => import('./pages/Upload'), { retries: 2 });
const Settings = lazyWithRetry(() => import('./pages/Settings'), { retries: 2 });

function App() {
  // Handle about:blank URLs
  React.useEffect(() => {
    try {
      if (window.location.href === 'about:blank' || window.location.pathname === '/about:blank') {
        window.location.href = '/';
      }
    } catch (e) {
      console.warn('URL check failed:', e);
    }
  }, []);

  // Production safety check
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.origin.includes('localhost')) {
      console.log('Production app loaded:', window.location.origin);
    }
  }, []);

  return (
    <SuspenseWithTimeout 
      initialFallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ClientProvider>
        <Routes>
          {/* Guest-only pages */}
          <Route element={<GuestRoute />}>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Public helper routes */}
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/signout" element={<SignOut />} />
          
          {/* Protected pages (require session) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <LazyBoundary label="Dashboard">
                  <Dashboard />
                </LazyBoundary>
              } />
              <Route path="/team-tasks" element={
                <LazyBoundary label="TeamTasks">
                  <TeamTasks />
                </LazyBoundary>
              } />
              <Route path="/upload" element={
                <LazyBoundary label="Upload">
                  <Upload />
                </LazyBoundary>
              } />
              <Route path="/reviews" element={
                <LazyBoundary label="Reviews">
                  <Reviews />
                </LazyBoundary>
              } />
              <Route path="/newsletter" element={
                <LazyBoundary label="Newsletter">
                  <Newsletter />
                </LazyBoundary>
              } />
              <Route path="/settings" element={
                <LazyBoundary label="Settings">
                  <Settings />
                </LazyBoundary>
              } />
            </Route>
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ClientProvider>
    </SuspenseWithTimeout>
  );
}

export default App;
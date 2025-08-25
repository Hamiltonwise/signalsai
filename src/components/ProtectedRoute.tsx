import * as React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthReady } from '../hooks/useAuthReady';

export default function ProtectedRoute() {
  const { ready, session } = useAuthReady();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  if (!session) {
    // Authoritative redirect for signed-out state:
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
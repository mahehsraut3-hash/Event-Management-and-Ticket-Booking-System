import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import useAuth from '../hooks/useAuth';

/**
 * ProtectedRoute component for guarding private and role-restricted routes
 * @param {Array<string>} allowedRoles - Optional list of permitted roles (e.g. ['organizer', 'admin'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-medium">Authenticating user session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-600 mt-2">
            This area requires one of the following roles: <br />
            <span className="font-semibold text-indigo-600">{allowedRoles.join(', ')}</span>.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Current account: <span className="font-mono">{user?.email}</span> ({role})
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Discover Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

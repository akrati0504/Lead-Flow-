import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute:
 * - Redirects unauthenticated users to /login.
 * - Enforces allowed roles (e.g. ['admin'] or ['employee']).
 * - Prevents cross-role access (e.g. employee accessing admin route, admin accessing employee route).
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted fw-semibold">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If authenticated user does not have permission for this route, redirect to their own dashboard
    const fallbackPath = user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}


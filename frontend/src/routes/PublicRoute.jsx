import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PublicRoute:
 * - Allows access to unauthenticated visitors (e.g. /login).
 * - If user is already authenticated, redirects them to their respective role dashboard.
 */
export default function PublicRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const destination = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children;
}


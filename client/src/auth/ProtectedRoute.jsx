import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600 dark:text-slate-300">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-300 border-r-transparent"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user?.role !== role) {
    // Redirect based on actual role
    if (user?.role === 'patient') return <Navigate to="/patient/dashboard" replace />;
    if (user?.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    // If user has no role or unknown role, redirect to home
    return <Navigate to="/" replace />;
  }

  // If role is required but user has no role, redirect to home
  if (role && !user?.role) {
    return <Navigate to="/" replace />;
  }

  // Ensure we always return valid JSX
  if (!children) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600 dark:text-slate-300">
        <p>No content available</p>
      </div>
    );
  }

  return <>{children}</>;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  role: PropTypes.oneOf(['patient', 'doctor', 'admin']),
};

export default ProtectedRoute;



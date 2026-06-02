/**
 * Protected Route Component
 *
 * Wraps routes that require authentication or admin access.
 * Redirects unauthenticated users to login, unauthorized users to home.
 */

import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { lang } = useParams<{ lang: string }>();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <span className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/${lang || 'en'}/login`} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={`/${lang || 'en'}`} replace />;
  }

  return <>{children}</>;
}

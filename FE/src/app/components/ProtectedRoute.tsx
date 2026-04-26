import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { AuthStatusScreen } from './AuthStatusScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <AuthStatusScreen title="Loading workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserAuth } from './UserAuthContext';

interface UserProtectedRouteProps {
  children: ReactNode;
}

const UserProtectedRoute = ({ children }: UserProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useUserAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block">
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/user/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default UserProtectedRoute;

// D:\Project\campmanagementsystem\src\user\pages\auth\UserProtectedRoute.tsx

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserAuth } from './UserAuthContext';
import Bridge from './Bridge'; // Import Bridge component

interface UserProtectedRouteProps {
  children: ReactNode;
}

const UserProtectedRoute = ({ children }: UserProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useUserAuth();
  const location = useLocation();

  if (isLoading) {
    return <Bridge noBlur={false} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/user/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default UserProtectedRoute;
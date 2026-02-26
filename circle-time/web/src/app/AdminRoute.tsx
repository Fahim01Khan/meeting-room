'use client';

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn, getUser } from '../services/api';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard that requires an authenticated user with role='admin'.
 * - Not logged in  → redirect to /login
 * - Logged in but not admin → redirect to /rooms
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = getUser();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/rooms" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;

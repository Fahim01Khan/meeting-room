import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../pages/Login';
import { RoomSearch } from '../pages/Booking/RoomSearch';
import { FloorMap } from '../pages/Booking/FloorMap';
import { RoomDetails } from '../pages/Booking/RoomDetails';
import { Dashboard } from '../pages/Admin/Dashboard';
import { UtilizationView } from '../pages/Admin/UtilizationView';
import { GhostingView } from '../pages/Admin/GhostingView';
import { CapacityView } from '../pages/Admin/CapacityView';

export const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/rooms" replace />} />
          
          {/* Booking Routes */}
          <Route path="rooms" element={<RoomSearch />} />
          <Route path="rooms/:roomId" element={<RoomDetailsWrapper />} />
          <Route path="floor-map" element={<FloorMap />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="admin/dashboard" element={<Dashboard />} />
          <Route path="admin/utilization" element={<UtilizationView />} />
          <Route path="admin/ghosting" element={<GhostingView />} />
          <Route path="admin/capacity" element={<CapacityView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

// Wrapper to extract roomId from URL params
const RoomDetailsWrapper: React.FC = () => {
  // In a real app, we'd use useParams from react-router-dom
  // For now, using a placeholder
  const roomId = window.location.pathname.split('/').pop() || '1';
  
  const handleBack = () => {
    window.history.back();
  };

  return <RoomDetails roomId={roomId} onBack={handleBack} />;
};

export default Router;

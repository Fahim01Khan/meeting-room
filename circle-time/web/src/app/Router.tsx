import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Layout } from './Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../pages/Login';
import { LandingPage } from '../pages/LandingPage';
import { RoomSearch } from '../pages/Booking/RoomSearch';
import { FloorMap } from '../pages/Booking/FloorMap';
import { RoomDetails } from '../pages/Booking/RoomDetails';
import { BookingModal } from '../pages/Booking/BookingModal';
import { AnalyticsPage } from '../pages/Admin/AnalyticsPage';
import { DevicesPage } from '../pages/Admin/DevicesPage';
import { RoomsPage } from '../pages/Admin/RoomsPage';
import { UsersPage } from '../pages/Admin/UsersPage';
import { SettingsPage } from '../pages/Admin/SettingsPage';
import { AcceptInvitePage } from '../pages/AcceptInvitePage';
import type { Room } from '../types/room';

export const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        
        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="rooms" element={<RoomSearchWrapper />} />
          <Route path="rooms/:roomId" element={<RoomDetailsWrapper />} />
          <Route path="floor-map" element={<FloorMapWrapper />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="admin/analytics" element={<AnalyticsPage />} />
          <Route path="admin/users" element={<UsersPage />} />
          <Route path="admin/rooms" element={<RoomsPage />} />
          <Route path="admin/devices" element={<DevicesPage />} />
          <Route path="admin/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

// Wrapper to navigate from room search to room details
const RoomSearchWrapper: React.FC = () => {
  const navigate = useNavigate();
  
  const handleRoomSelect = (room: Room) => {
    navigate(`/rooms/${room.id}`);
  };

  return <RoomSearch onRoomSelect={handleRoomSelect} />;
};

// Wrapper to navigate from floor map room click to room details
const FloorMapWrapper: React.FC = () => {
  const navigate = useNavigate();

  const handleRoomSelect = (room: Room) => {
    navigate(`/rooms/${room.id}`);
  };

  return <FloorMap onRoomSelect={handleRoomSelect} />;
};

// Wrapper to extract roomId and manage BookingModal
const RoomDetailsWrapper: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBack = () => {
    navigate('/rooms');
  };

  const handleBookRoom = (room: Room) => {
    setBookingRoom(room);
  };

  const handleBookingComplete = () => {
    setBookingRoom(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <RoomDetails
        key={refreshKey}
        roomId={roomId || ''}
        onBack={handleBack}
        onBookRoom={handleBookRoom}
      />
      {bookingRoom && (
        <BookingModal
          room={bookingRoom}
          isOpen={true}
          onClose={() => setBookingRoom(null)}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </>
  );
};

export default Router;

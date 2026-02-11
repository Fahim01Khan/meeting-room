'use client';

import React, { useState, useEffect } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';
import type { Room } from '../../types/room';
import type { Booking } from '../../types/booking';
import { fetchRoomById } from '../../services/rooms';
import { fetchBookingsByRoom } from '../../services/bookings';
import { LoadingState } from '../../components/LoadingState';

interface RoomDetailsProps {
  roomId: string;
  onBookRoom?: (room: Room) => void;
  onBack?: () => void;
}

const amenityIcons: Record<string, React.ReactNode> = {
  projector: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M17 2h2v5" />
      <path d="M5 2h2v5" />
      <circle cx="12" cy="14" r="3" />
    </svg>
  ),
  whiteboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="14" y2="16" />
    </svg>
  ),
  video_conference: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  ),
  phone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  tv_display: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  air_conditioning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M2 12h20M4 4l16 16M20 4L4 20" />
    </svg>
  ),
};

export const RoomDetails: React.FC<RoomDetailsProps> = ({ roomId, onBookRoom, onBack }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [roomData, bookingsData] = await Promise.all([
          fetchRoomById(roomId),
          fetchBookingsByRoom(roomId, selectedDate),
        ]);
        setRoom(roomData);
        setBookings(bookingsData);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [roomId, selectedDate]);

  if (loading) {
    return <LoadingState message="Loading room details..." />;
  }

  if (!room) {
    return (
      <div style={{ padding: spacing.lg, textAlign: 'center', color: colors.textSecondary }}>
        <p>Room not found</p>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    padding: spacing.lg,
    maxWidth: '900px',
    margin: '0 auto',
  };

  const backButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    cursor: 'pointer',
    marginBottom: spacing.lg,
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: spacing.xl,
  };

  const titleRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  };

  const statusBadgeStyle: React.CSSProperties = {
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    backgroundColor: room.status === 'available' ? colors.successLight : colors.errorLight,
    color: room.status === 'available' ? colors.success : colors.error,
    textTransform: 'capitalize',
  };

  const metaStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: spacing.xl,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: shadows.sm,
  };

  const amenitiesGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: spacing.md,
  };

  const amenityItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    color: colors.text,
    fontSize: typography.fontSize.sm,
  };

  const bookingItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottom: `1px solid ${colors.border}`,
  };

  const bookButtonStyle: React.CSSProperties = {
    padding: `${spacing.md} ${spacing.xl}`,
    backgroundColor: colors.primary,
    color: colors.background,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    width: '100%',
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return <LoadingState message="Loading room details..." />;
  }

  return (
    <div style={containerStyle}>
      {onBack && (
        <button type="button" style={backButtonStyle} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to search
        </button>
      )}

      <div style={headerStyle}>
        <div style={titleRowStyle}>
          <h1 style={titleStyle}>{room.name}</h1>
          <span style={statusBadgeStyle}>{room.status}</span>
        </div>
        <p style={metaStyle}>
          {room.building} · Floor {room.floor} · Capacity: {room.capacity} people
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Amenities</h2>
        <div style={cardStyle}>
          <div style={amenitiesGridStyle}>
            {room.amenities.map((amenity) => (
              <div key={amenity} style={amenityItemStyle}>
                <span style={{ color: colors.primary }}>{amenityIcons[amenity]}</span>
                <span style={{ textTransform: 'capitalize' }}>{amenity.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Today's Schedule</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.sm,
              fontSize: typography.fontSize.sm,
            }}
          />
        </div>
        <div style={cardStyle}>
          {bookings.length === 0 ? (
            <p style={{ color: colors.textSecondary, textAlign: 'center', padding: spacing.lg }}>
              No bookings scheduled for this date
            </p>
          ) : (
            bookings.map((booking, index) => (
              <div
                key={booking.id}
                style={{
                  ...bookingItemStyle,
                  borderBottom: index === bookings.length - 1 ? 'none' : bookingItemStyle.borderBottom,
                }}
              >
                <div>
                  <p style={{ fontWeight: typography.fontWeight.medium, color: colors.text, marginBottom: spacing.xs }}>
                    {booking.title}
                  </p>
                  <p style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)} · {booking.organizer.name}
                  </p>
                </div>
                <span
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: borderRadius.sm,
                    fontSize: typography.fontSize.xs,
                    backgroundColor: booking.checkedIn ? colors.successLight : colors.warningLight,
                    color: booking.checkedIn ? colors.success : colors.warning,
                  }}
                >
                  {booking.checkedIn ? 'Checked In' : 'Pending'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {onBookRoom && room.status !== 'maintenance' && (
        <button type="button" style={bookButtonStyle} onClick={() => onBookRoom(room)}>
          Book This Room
        </button>
      )}
    </div>
  );
};

export default RoomDetails;

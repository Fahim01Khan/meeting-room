'use client';

import React from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import type { Room } from '../types/room';

interface RoomCardProps {
  room: Room;
  onClick?: (room: Room) => void;
}

const statusColors: Record<Room['status'], { bg: string; text: string }> = {
  available: { bg: colors.successLight, text: colors.success },
  occupied: { bg: colors.errorLight, text: colors.error },
  reserved: { bg: colors.warningLight, text: colors.warning },
  maintenance: { bg: colors.border, text: colors.textMuted },
};

const amenityLabels: Record<string, string> = {
  projector: 'Projector',
  whiteboard: 'Whiteboard',
  video_conference: 'Video Conf',
  phone: 'Phone',
  tv_display: 'TV Display',
  air_conditioning: 'A/C',
};

export const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  const statusStyle = statusColors[room.status];

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    cursor: onClick ? 'pointer' : 'default',
    boxShadow: shadows.sm,
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    margin: 0,
  };

  const locationStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  };

  const statusBadgeStyle: React.CSSProperties = {
    backgroundColor: statusStyle.bg,
    color: statusStyle.text,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'capitalize',
  };

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  };

  const infoItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  };

  const amenitiesStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
  };

  const amenityTagStyle: React.CSSProperties = {
    backgroundColor: colors.backgroundSecondary,
    color: colors.textSecondary,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.sm,
    fontSize: typography.fontSize.xs,
  };

  const handleClick = () => {
    if (onClick) {
      onClick(room);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(room);
    }
  };

  return (
    <div
      style={cardStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>{room.name}</h3>
          <p style={locationStyle}>
            {room.building} · Floor {room.floor}
          </p>
        </div>
        <span style={statusBadgeStyle}>{room.status}</span>
      </div>

      <div style={infoRowStyle}>
        <div style={infoItemStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{room.capacity} people</span>
        </div>
      </div>

      <div style={amenitiesStyle}>
        {room.amenities.map((amenity) => (
          <span key={amenity} style={amenityTagStyle}>
            {amenityLabels[amenity] || amenity}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RoomCard;

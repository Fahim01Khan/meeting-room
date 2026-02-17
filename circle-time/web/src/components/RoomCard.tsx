'use client';

import React from 'react';
import type { Room } from '../types/room';
import { AMENITY_LABELS } from '../constants/room';
import { formatCapacity } from '../utils/formatting';
import styles from './RoomCard.module.css';

interface RoomCardProps {
  room: Room;
  onClick?: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
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

  const cardClassName = `${styles.card} ${!onClick ? styles.nonClickable : ''}`;
  const statusClass = styles[room.status as keyof typeof styles]
  const statusClassName = `${styles.statusBadge} ${statusClass ?? ''}`;
  
  return (
    <div
      className={cardClassName}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{room.name}</h3>
          <p className={styles.location}>
            {room.building} · Floor {room.floor}
          </p>
        </div>
        <span className={statusClassName}>{room.status}</span>
      </div>

      <div className={styles.infoRow}>
        <div className={styles.infoItem}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{formatCapacity(room.capacity)}</span>
        </div>
      </div>

      <div className={styles.amenities}>
        {room.amenities.map((amenity) => (
          <span key={amenity} className={styles.amenityTag}>
            {AMENITY_LABELS[amenity] || amenity}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RoomCard;

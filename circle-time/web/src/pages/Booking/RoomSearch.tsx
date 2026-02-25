'use client';

import React, { useState, useEffect } from 'react';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import type { Room, RoomFilter, Amenity } from '../../types/room';
import { fetchRooms, fetchRoomsFiltered } from '../../services/rooms';
import { RoomCard } from '../../components/RoomCard';
import { LoadingState } from '../../components/LoadingState';

interface RoomSearchProps {
  onRoomSelect?: (room: Room) => void;
}

const amenityOptions: { value: Amenity; label: string }[] = [
  { value: 'projector', label: 'Projector' },
  { value: 'whiteboard', label: 'Whiteboard' },
  { value: 'video_conference', label: 'Video Conference' },
  { value: 'phone', label: 'Phone' },
  { value: 'tv_display', label: 'TV Display' },
  { value: 'air_conditioning', label: 'A/C' },
];

export const RoomSearch: React.FC<RoomSearchProps> = ({ onRoomSelect }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<string[]>([]);
  const [floors, setFloors] = useState<number[]>([]);
  const [filters, setFilters] = useState<RoomFilter>({
    building: '',
    floor: undefined,
    minCapacity: undefined,
    amenities: [],
    searchQuery: '',
  });

  // Fetch all rooms once to derive building/floor options
  useEffect(() => {
    fetchRooms()
      .then((data) => {
        const uniqueBuildings = Array.from(new Set(data.map((r) => r.building))).sort();
        const uniqueFloors = Array.from(new Set(data.map((r) => r.floor))).sort((a, b) => a - b);
        setBuildings(uniqueBuildings);
        setFloors(uniqueFloors);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      try {
        const data = await fetchRoomsFiltered(filters);
        setRooms(data);
      } finally {
        setLoading(false);
      }
    };
    loadRooms();
  }, [filters]);

  const containerStyle: React.CSSProperties = {
    padding: spacing.lg,
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: spacing.xl,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  };

  const filtersStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  };

  const filterGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    minWidth: '160px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  };

  const inputStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    backgroundColor: colors.background,
    cursor: 'pointer',
  };

  const searchInputStyle: React.CSSProperties = {
    ...inputStyle,
    flex: 1,
    minWidth: '250px',
  };

  const checkboxGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    cursor: 'pointer',
  };

  const roomGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: spacing.lg,
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: spacing.xxl,
    color: colors.textSecondary,
  };

  const handleAmenityChange = (amenity: Amenity, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      amenities: checked
        ? [...(prev.amenities || []), amenity]
        : (prev.amenities || []).filter((a) => a !== amenity),
    }));
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Find a Room</h1>
        <p style={subtitleStyle}>Search and filter available meeting rooms</p>
      </div>

      <div style={filtersStyle}>
        <div style={{ ...filterGroupStyle, flex: 1 }}>
          <label style={labelStyle}>Search</label>
          <input
            type="text"
            style={searchInputStyle}
            placeholder="Search by room name..."
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
          />
        </div>

        <div style={filterGroupStyle}>
          <label style={labelStyle}>Building</label>
          <select
            style={inputStyle}
            value={filters.building}
            onChange={(e) => setFilters((prev) => ({ ...prev, building: e.target.value }))}
          >
            <option value="">All Buildings</option>
            {buildings.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div style={filterGroupStyle}>
          <label style={labelStyle}>Floor</label>
          <select
            style={inputStyle}
            value={filters.floor ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                floor: e.target.value ? parseInt(e.target.value) : undefined,
              }))
            }
          >
            <option value="">All Floors</option>
            {floors.map((f) => (
              <option key={f} value={f}>Floor {f}</option>
            ))}
          </select>
        </div>

        <div style={filterGroupStyle}>
          <label style={labelStyle}>Min Capacity</label>
          <select
            style={inputStyle}
            value={filters.minCapacity ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                minCapacity: e.target.value ? parseInt(e.target.value) : undefined,
              }))
            }
          >
            <option value="">Any</option>
            <option value="2">2+ people</option>
            <option value="4">4+ people</option>
            <option value="8">8+ people</option>
            <option value="12">12+ people</option>
            <option value="20">20+ people</option>
          </select>
        </div>

        <div style={{ ...filterGroupStyle, width: '100%' }}>
          <label style={labelStyle}>Amenities</label>
          <div style={checkboxGroupStyle}>
            {amenityOptions.map((option) => (
              <label key={option.value} style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={filters.amenities?.includes(option.value) || false}
                  onChange={(e) => handleAmenityChange(option.value, e.target.checked)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Searching rooms..." />
      ) : rooms.length === 0 ? (
        <div style={emptyStateStyle}>
          <p>No rooms found matching your criteria</p>
        </div>
      ) : (
        <div style={roomGridStyle}>
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onClick={onRoomSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomSearch;

'use client';

import React, { useState, useEffect } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';
import { fetchRooms } from '../../services/rooms';
import type { Room } from '../../types/room';

interface FloorMapProps {
  buildingId?: string;
  floor?: number;
  onRoomSelect?: (room: Room) => void;
}

interface RoomPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  raw: Room;
}

export const FloorMap: React.FC<FloorMapProps> = ({ onRoomSelect }) => {
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [allRooms, setAllRooms] = useState<Room[]>([]);

  const containerStyle: React.CSSProperties = {
    padding: spacing.lg,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.md,
    alignItems: 'center',
  };

  const selectStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    backgroundColor: colors.background,
  };

  const mapContainerStyle: React.CSSProperties = {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: shadows.sm,
  };

  const legendStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    justifyContent: 'center',
  };

  const legendItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  };

  const legendDotStyle = (color: string): React.CSSProperties => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: color,
  });

  const svgContainerStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: colors.text,
    color: colors.background,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.sm,
    fontSize: typography.fontSize.xs,
    pointerEvents: 'none',
    zIndex: 100,
  };

  // Rooms from API, laid out on SVG grid
  const [rooms, setRooms] = useState<RoomPosition[]>([]);

  // Fetch all rooms once
  useEffect(() => {
    fetchRooms()
      .then((data) => setAllRooms(data))
      .catch(console.error);
  }, []);

  // Filter + position rooms when floor changes or data loads
  useEffect(() => {
    const floorRooms = allRooms.filter((r) => r.floor === selectedFloor);
    const positions: RoomPosition[] = floorRooms.map((r, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      return {
        id: r.id,
        name: r.name,
        x: 50 + col * 150,
        y: 50 + row * 110,
        width: col === 2 ? 70 : 120,
        height: 80,
        status: r.status,
        raw: r,
      };
    });
    setRooms(positions);
  }, [allRooms, selectedFloor]);

  const getStatusColor = (status: RoomPosition['status']) => {
    switch (status) {
      case 'available':
        return colors.success;
      case 'occupied':
        return colors.error;
      case 'reserved':
        return colors.warning;
      case 'maintenance':
        return colors.textMuted;
      default:
        return colors.border;
    }
  };

  const handleRoomClick = (room: RoomPosition) => {
    if (onRoomSelect) {
      onRoomSelect(room.raw);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Floor Map</h1>
        <div style={controlsStyle}>
          <select style={selectStyle}>
            <option value="main">Main Building</option>
            <option value="executive">Executive Wing</option>
            <option value="annex">Annex</option>
          </select>
          <select
            style={selectStyle}
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(parseInt(e.target.value))}
          >
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
            <option value="3">Floor 3</option>
          </select>
        </div>
      </div>

      <div style={mapContainerStyle}>
        <div style={legendStyle}>
          <div style={legendItemStyle}>
            <div style={legendDotStyle(colors.success)} />
            <span>Available</span>
          </div>
          <div style={legendItemStyle}>
            <div style={legendDotStyle(colors.error)} />
            <span>Occupied</span>
          </div>
          <div style={legendItemStyle}>
            <div style={legendDotStyle(colors.warning)} />
            <span>Reserved</span>
          </div>
          <div style={legendItemStyle}>
            <div style={legendDotStyle(colors.textMuted)} />
            <span>Maintenance</span>
          </div>
        </div>

        <div style={svgContainerStyle}>
          <svg
            width="100%"
            height="400"
            viewBox="0 0 500 300"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Floor outline */}
            <rect
              x="20"
              y="20"
              width="460"
              height="260"
              fill="none"
              stroke={colors.border}
              strokeWidth="2"
            />

            {/* Corridor */}
            <rect
              x="20"
              y="130"
              width="460"
              height="30"
              fill={colors.backgroundSecondary}
            />

            {/* Rooms */}
            {rooms.map((room) => (
              <g
                key={room.id}
                onMouseEnter={() => setHoveredRoom(room.id)}
                onMouseLeave={() => setHoveredRoom(null)}
                onClick={() => handleRoomClick(room)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  fill={hoveredRoom === room.id ? colors.primaryLight : colors.background}
                  stroke={getStatusColor(room.status)}
                  strokeWidth="3"
                  rx="4"
                />
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fill={colors.text}
                >
                  {room.name}
                </text>
                <circle
                  cx={room.x + room.width - 12}
                  cy={room.y + 12}
                  r="6"
                  fill={getStatusColor(room.status)}
                />
              </g>
            ))}

            {/* Entrance */}
            <rect x="230" y="280" width="40" height="10" fill={colors.primary} />
            <text
              x="250"
              y="295"
              textAnchor="middle"
              fontSize="8"
              fill={colors.background}
            >
              Entry
            </text>
          </svg>
        </div>

        {hoveredRoom && (
          <div style={{ marginTop: spacing.md, textAlign: 'center' }}>
            <span style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
              Click to view room details &amp; book
            </span>
          </div>
        )}

        {rooms.length === 0 && (
          <div style={{ marginTop: spacing.md, textAlign: 'center', padding: spacing.lg }}>
            <span style={{ color: colors.textSecondary, fontSize: typography.fontSize.base }}>
              No rooms on this floor
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: borderRadius.md,
          fontSize: typography.fontSize.sm,
          color: colors.textSecondary,
          textAlign: 'center',
        }}
      >
        Floor {selectedFloor} • Main Building • Last updated: Just now
      </div>
    </div>
  );
};

export default FloorMap;

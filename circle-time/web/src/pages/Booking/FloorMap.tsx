'use client';

import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';

interface FloorMapProps {
  buildingId?: string;
  floor?: number;
}

interface RoomPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'available' | 'occupied' | 'reserved';
}

export const FloorMap: React.FC<FloorMapProps> = () => {
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

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

  // Mock room positions for SVG floor plan
  const mockRooms: RoomPosition[] = [
    { id: '1', name: 'Conference A', x: 50, y: 50, width: 120, height: 80, status: 'available' },
    { id: '2', name: 'Meeting B', x: 200, y: 50, width: 100, height: 80, status: 'occupied' },
    { id: '3', name: 'Huddle 1', x: 330, y: 50, width: 70, height: 60, status: 'available' },
    { id: '4', name: 'Board Room', x: 50, y: 160, width: 150, height: 100, status: 'reserved' },
    { id: '5', name: 'Meeting C', x: 230, y: 160, width: 100, height: 80, status: 'available' },
    { id: '6', name: 'Huddle 2', x: 360, y: 160, width: 70, height: 60, status: 'occupied' },
  ];

  const getStatusColor = (status: RoomPosition['status']) => {
    switch (status) {
      case 'available':
        return colors.success;
      case 'occupied':
        return colors.error;
      case 'reserved':
        return colors.warning;
      default:
        return colors.border;
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
            {mockRooms.map((room) => (
              <g
                key={room.id}
                onMouseEnter={() => setHoveredRoom(room.id)}
                onMouseLeave={() => setHoveredRoom(null)}
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
              Click a room for details
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

'use client';

import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';
import type { DateRange } from '../../types/analytics';
import { DateRangePicker } from '../../components/DateRangePicker';

export const UtilizationView: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedBuilding, setSelectedBuilding] = useState('all');

  const containerStyle: React.CSSProperties = {
    padding: spacing.lg,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    flexWrap: 'wrap',
    gap: spacing.md,
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

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.md,
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  const selectStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    backgroundColor: colors.background,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: shadows.sm,
    marginBottom: spacing.lg,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  };

  const chartPlaceholderStyle: React.CSSProperties = {
    height: '250px',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textSecondary,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  };

  // Mock utilization data
  const utilizationData = [
    { room: 'Conference A', rate: 82, trend: 'up' },
    { room: 'Meeting B', rate: 67, trend: 'down' },
    { room: 'Board Room', rate: 75, trend: 'up' },
    { room: 'Huddle 1', rate: 54, trend: 'stable' },
    { room: 'Huddle 2', rate: 61, trend: 'up' },
    { room: 'Training Room', rate: 45, trend: 'down' },
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Room Utilization</h1>
          <p style={subtitleStyle}>Analyze how efficiently rooms are being used</p>
        </div>
        <div style={controlsStyle}>
          <select
            style={selectStyle}
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="all">All Buildings</option>
            <option value="main">Main Building</option>
            <option value="executive">Executive Wing</option>
            <option value="annex">Annex</option>
          </select>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Utilization Over Time</h2>
        <div style={chartPlaceholderStyle}>
          <div style={{ textAlign: 'center' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5">
              <path d="M3 3v18h18" />
              <path d="M7 16l4-4 4 4 5-5" />
            </svg>
            <p style={{ marginTop: spacing.sm, fontSize: typography.fontSize.sm }}>
              Line Chart: Daily utilization trends
            </p>
          </div>
        </div>
      </div>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>By Time of Day</h2>
          <div style={chartPlaceholderStyle}>
            <div style={{ textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5">
                <path d="M12 2v20M2 12h20" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <p style={{ marginTop: spacing.sm, fontSize: typography.fontSize.sm }}>
                Peak hours visualization
              </p>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>By Day of Week</h2>
          <div style={chartPlaceholderStyle}>
            <div style={{ textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p style={{ marginTop: spacing.sm, fontSize: typography.fontSize.sm }}>
                Weekly patterns
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Room-by-Room Utilization</h2>
        <div style={{ overflowX: 'auto' }}>
          {utilizationData.map((item) => (
            <div
              key={item.room}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: `${spacing.md} 0`,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ width: '150px', fontWeight: typography.fontWeight.medium, color: colors.text }}>
                {item.room}
              </div>
              <div style={{ flex: 1, paddingRight: spacing.lg }}>
                <div
                  style={{
                    height: '24px',
                    backgroundColor: colors.border,
                    borderRadius: borderRadius.full,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${item.rate}%`,
                      height: '100%',
                      backgroundColor: item.rate >= 70 ? colors.success : item.rate >= 50 ? colors.warning : colors.error,
                      borderRadius: borderRadius.full,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
              <div style={{ width: '60px', textAlign: 'right', fontWeight: typography.fontWeight.semibold }}>
                {item.rate}%
              </div>
              <div style={{ width: '40px', textAlign: 'center' }}>
                {item.trend === 'up' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                )}
                {item.trend === 'down' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                )}
                {item.trend === 'stable' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UtilizationView;

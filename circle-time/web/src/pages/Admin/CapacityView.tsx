'use client';

import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';
import type { DateRange } from '../../types/analytics';
import { DateRangePicker } from '../../components/DateRangePicker';
import { KPIStat } from '../../components/KPIStat';

export const CapacityView: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

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

  const kpiGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing.lg,
    marginBottom: spacing.xl,
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

  // Mock capacity data
  const capacityStats = [
    { label: 'Avg Capacity Used', value: '58%', change: 5, changeType: 'positive' as const },
    { label: 'Oversized Bookings', value: 156, change: -12, changeType: 'positive' as const },
    { label: 'Undersized Bookings', value: 89, change: 8, changeType: 'negative' as const },
    { label: 'Right-Sized Rate', value: '72%', change: 4, changeType: 'positive' as const },
  ];

  const roomCapacityData = [
    { room: 'Board Room', capacity: 20, avgAttendees: 8, utilization: 40 },
    { room: 'Conference A', capacity: 10, avgAttendees: 7, utilization: 70 },
    { room: 'Meeting B', capacity: 6, avgAttendees: 4, utilization: 67 },
    { room: 'Huddle 1', capacity: 4, avgAttendees: 3, utilization: 75 },
    { room: 'Training Room', capacity: 30, avgAttendees: 12, utilization: 40 },
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Capacity Analysis</h1>
          <p style={subtitleStyle}>Understand room sizing efficiency and optimize space usage</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div style={kpiGridStyle}>
        {capacityStats.map((stat, index) => (
          <KPIStat key={index} data={stat} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: spacing.lg }}>
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Capacity Distribution</h2>
          <div style={chartPlaceholderStyle}>
            <div style={{ textAlign: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10" />
                <path d="M12 2a10 10 0 0 0-7 17" />
              </svg>
              <p style={{ marginTop: spacing.sm, fontSize: typography.fontSize.sm }}>
                Pie chart: Booking size distribution
              </p>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Room Size vs Actual Usage</h2>
          <div style={chartPlaceholderStyle}>
            <div style={{ textAlign: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5">
                <path d="M3 3v18h18" />
                <circle cx="9" cy="13" r="2" />
                <circle cx="14" cy="8" r="2" />
                <circle cx="18" cy="11" r="2" />
                <circle cx="7" cy="7" r="2" />
              </svg>
              <p style={{ marginTop: spacing.sm, fontSize: typography.fontSize.sm }}>
                Scatter plot: Capacity vs attendees
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Room-by-Room Capacity Efficiency</h2>
        <div style={{ overflowX: 'auto' }}>
          {roomCapacityData.map((room) => (
            <div
              key={room.room}
              style={{
                display: 'grid',
                gridTemplateColumns: '150px 1fr 100px',
                alignItems: 'center',
                padding: `${spacing.md} 0`,
                borderBottom: `1px solid ${colors.border}`,
                gap: spacing.lg,
              }}
            >
              <div>
                <p style={{ fontWeight: typography.fontWeight.medium, color: colors.text }}>
                  {room.room}
                </p>
                <p style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
                  Capacity: {room.capacity}
                </p>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                  <span style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, width: '100px' }}>
                    Avg attendees:
                  </span>
                  <div style={{ flex: 1, position: 'relative', height: '24px' }}>
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        backgroundColor: colors.border,
                        borderRadius: borderRadius.sm,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: `${(room.avgAttendees / room.capacity) * 100}%`,
                        height: '100%',
                        backgroundColor: colors.primary,
                        borderRadius: borderRadius.sm,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        left: spacing.sm,
                        fontSize: typography.fontSize.xs,
                        color: colors.background,
                        fontWeight: typography.fontWeight.medium,
                      }}
                    >
                      {room.avgAttendees} / {room.capacity}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: borderRadius.full,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    backgroundColor: room.utilization >= 60 ? colors.successLight : room.utilization >= 40 ? colors.warningLight : colors.errorLight,
                    color: room.utilization >= 60 ? colors.success : room.utilization >= 40 ? colors.warning : colors.error,
                  }}
                >
                  {room.utilization}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Optimization Insights</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: spacing.lg }}>
          <div
            style={{
              padding: spacing.lg,
              backgroundColor: colors.warningLight,
              borderRadius: borderRadius.md,
              borderLeft: `4px solid ${colors.warning}`,
            }}
          >
            <h3 style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text, marginBottom: spacing.sm }}>
              Oversized Room Usage
            </h3>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              Board Room is frequently booked for small meetings (2-4 people). Consider promoting smaller rooms for these meetings.
            </p>
          </div>
          <div
            style={{
              padding: spacing.lg,
              backgroundColor: colors.successLight,
              borderRadius: borderRadius.md,
              borderLeft: `4px solid ${colors.success}`,
            }}
          >
            <h3 style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text, marginBottom: spacing.sm }}>
              Well-Utilized Rooms
            </h3>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              Huddle rooms show optimal capacity usage. Consider adding more huddle spaces to meet demand.
            </p>
          </div>
          <div
            style={{
              padding: spacing.lg,
              backgroundColor: colors.primaryLight,
              borderRadius: borderRadius.md,
              borderLeft: `4px solid ${colors.primary}`,
            }}
          >
            <h3 style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text, marginBottom: spacing.sm }}>
              Recommended Action
            </h3>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              Implement room size recommendations during booking based on expected attendee count.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapacityView;

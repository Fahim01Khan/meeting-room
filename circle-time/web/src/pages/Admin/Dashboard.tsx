'use client';

import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import type { DateRange, KPIData } from '../../types/analytics';
import { KPIStat } from '../../components/KPIStat';
import { DateRangePicker } from '../../components/DateRangePicker';

export const Dashboard: React.FC = () => {
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: spacing.lg,
    marginBottom: spacing.xl,
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

  const chartContainerStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  };

  const chartPlaceholderStyle: React.CSSProperties = {
    height: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: spacing.lg,
  };

  // Mock KPI data
  const kpiData: KPIData[] = [
    { label: 'Total Rooms', value: 48, change: 4, changeType: 'positive' },
    { label: 'Avg Utilization', value: '67%', change: 12, changeType: 'positive' },
    { label: 'Ghosting Rate', value: '18%', change: -5, changeType: 'negative' },
    { label: 'Total Bookings', value: 1247, change: 8, changeType: 'positive' },
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Analytics Dashboard</h1>
          <p style={subtitleStyle}>Monitor room utilization and booking patterns</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div style={kpiGridStyle}>
        {kpiData.map((kpi, index) => (
          <KPIStat key={index} data={kpi} />
        ))}
      </div>

      <div style={gridStyle}>
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Utilization Trends</h2>
          <div style={chartContainerStyle}>
            <div style={chartPlaceholderStyle}>
              <div style={{ textAlign: 'center' }}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.textMuted}
                  strokeWidth="1.5"
                >
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
                <p style={{ marginTop: spacing.sm }}>Utilization Chart Placeholder</p>
              </div>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Weekly Heatmap</h2>
          <div style={chartContainerStyle}>
            <HeatmapPlaceholder />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Room Performance Comparison</h2>
        <div style={chartContainerStyle}>
          <RoomComparisonTable />
        </div>
      </div>
    </div>
  );
};

const HeatmapPlaceholder: React.FC = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'];

  const getRandomColor = () => {
    const intensity = Math.random();
    if (intensity < 0.3) return colors.successLight;
    if (intensity < 0.6) return colors.warningLight;
    return colors.primaryLight;
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.sm, paddingLeft: '50px' }}>
        {hours.map((hour) => (
          <div
            key={hour}
            style={{
              width: '40px',
              fontSize: typography.fontSize.xs,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {hour}
          </div>
        ))}
      </div>
      {days.map((day) => (
        <div key={day} style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
          <div style={{ width: '40px', fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
            {day}
          </div>
          {hours.map((hour) => (
            <div
              key={`${day}-${hour}`}
              style={{
                width: '40px',
                height: '30px',
                backgroundColor: getRandomColor(),
                borderRadius: borderRadius.sm,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const RoomComparisonTable: React.FC = () => {
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: spacing.md,
    borderBottom: `2px solid ${colors.border}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  };

  const tdStyle: React.CSSProperties = {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.border}`,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  };

  const mockData = [
    { name: 'Conference A', utilization: 78, ghosting: 12, bookings: 156 },
    { name: 'Meeting B', utilization: 65, ghosting: 22, bookings: 134 },
    { name: 'Board Room', utilization: 82, ghosting: 8, bookings: 98 },
    { name: 'Huddle 1', utilization: 54, ghosting: 28, bookings: 187 },
    { name: 'Huddle 2', utilization: 61, ghosting: 15, bookings: 201 },
  ];

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Room</th>
          <th style={thStyle}>Utilization</th>
          <th style={thStyle}>Ghosting</th>
          <th style={thStyle}>Total Bookings</th>
        </tr>
      </thead>
      <tbody>
        {mockData.map((room) => (
          <tr key={room.name}>
            <td style={tdStyle}>{room.name}</td>
            <td style={tdStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <div
                  style={{
                    width: '60px',
                    height: '8px',
                    backgroundColor: colors.border,
                    borderRadius: borderRadius.full,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${room.utilization}%`,
                      height: '100%',
                      backgroundColor: colors.primary,
                    }}
                  />
                </div>
                <span>{room.utilization}%</span>
              </div>
            </td>
            <td style={tdStyle}>
              <span
                style={{
                  color: room.ghosting > 20 ? colors.error : room.ghosting > 10 ? colors.warning : colors.success,
                }}
              >
                {room.ghosting}%
              </span>
            </td>
            <td style={tdStyle}>{room.bookings}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Dashboard;

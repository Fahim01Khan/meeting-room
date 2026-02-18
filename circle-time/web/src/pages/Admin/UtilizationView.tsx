'use client';

import React, { useState, useEffect } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';
import type { DateRange, HeatmapCell } from '../../types/analytics';
import { DateRangePicker } from '../../components/DateRangePicker';
import { fetchUtilizationData, fetchTrendData, fetchHeatmapData } from '../../services/analytics';
import { fetchRooms } from '../../services/rooms';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

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

  // Dynamic buildings list
  const [buildings, setBuildings] = useState<string[]>([]);

  useEffect(() => {
    fetchRooms()
      .then((rooms) => {
        const unique = Array.from(new Set(rooms.map((r) => r.building).filter(Boolean)));
        setBuildings(unique);
      })
      .catch(console.error);
  }, []);

  // Utilization data from API
  const [utilizationData, setUtilizationData] = useState<{ room: string; rate: number; trend: string }[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; value: number }[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);

  useEffect(() => {
    fetchUtilizationData(dateRange)
      .then((data) =>
        setUtilizationData(
          data.map((d) => ({
            room: d.roomName,
            rate: d.utilizationRate,
            trend: d.utilizationRate >= 70 ? 'up' : d.utilizationRate >= 50 ? 'stable' : 'down',
          })),
        ),
      )
      .catch(console.error);
    fetchTrendData('utilization', dateRange).then(setTrendData).catch(console.error);
    fetchHeatmapData(dateRange, 'utilization').then(setHeatmapData).catch(console.error);
  }, [dateRange, selectedBuilding]);

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
            {buildings.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Utilization Over Time</h2>
        <div style={{ height: '250px' }}>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: colors.textSecondary }}
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: colors.textSecondary }}
                  tickFormatter={(v: number) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, 'Utilization']}
                  labelFormatter={(l: string) => new Date(l).toLocaleDateString()}
                />
                <Area type="monotone" dataKey="value" stroke={colors.primary} fill={colors.primaryLight} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={chartPlaceholderStyle}>No trend data available</div>
          )}
        </div>
      </div>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>By Time of Day</h2>
          <div style={{ height: '250px' }}>
            {heatmapData.length > 0 ? (() => {
              // Aggregate heatmap by hour
              const hourMap = new Map<number, number>();
              heatmapData.forEach((cell) => {
                hourMap.set(cell.hour, (hourMap.get(cell.hour) || 0) + cell.value);
              });
              const byHour = Array.from(hourMap.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([h, v]) => ({
                  hour: h > 12 ? `${h - 12}PM` : h === 12 ? '12PM' : `${h}AM`,
                  bookings: v,
                }));
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byHour} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: colors.textSecondary }} />
                    <YAxis tick={{ fontSize: 11, fill: colors.textSecondary }} />
                    <Tooltip formatter={(v: number) => [v, 'Bookings']} />
                    <Bar dataKey="bookings" fill={colors.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })() : (
              <div style={chartPlaceholderStyle}>No heatmap data available</div>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>By Day of Week</h2>
          <div style={{ height: '250px' }}>
            {heatmapData.length > 0 ? (() => {
              const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
              const dayMap = new Map<string, number>();
              heatmapData.forEach((cell) => {
                dayMap.set(cell.day, (dayMap.get(cell.day) || 0) + cell.value);
              });
              const byDay = dayOrder
                .filter((d) => dayMap.has(d))
                .map((d) => ({ day: d, bookings: dayMap.get(d) || 0 }));
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDay} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: colors.textSecondary }} />
                    <YAxis tick={{ fontSize: 11, fill: colors.textSecondary }} />
                    <Tooltip formatter={(v: number) => [v, 'Bookings']} />
                    <Bar dataKey="bookings" fill={colors.success} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })() : (
              <div style={chartPlaceholderStyle}>No heatmap data available</div>
            )}
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

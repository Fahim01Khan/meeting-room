'use client';

import React, { useState, useEffect } from 'react';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import type { DateRange, KPIData, RoomComparison, HeatmapCell } from '../../types/analytics';
import { KPIStat } from '../../components/KPIStat';
import { DateRangePicker } from '../../components/DateRangePicker';
import { fetchKPIData, fetchRoomComparison, fetchTrendData, fetchHeatmapData } from '../../services/analytics';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

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

  // KPI data from API
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; value: number }[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);

  useEffect(() => {
    fetchKPIData(dateRange).then(setKpiData).catch(console.error);
    fetchTrendData('utilization', dateRange).then(setTrendData).catch(console.error);
    fetchHeatmapData(dateRange, 'utilization').then(setHeatmapData).catch(console.error);
  }, [dateRange]);

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
            <div style={{ height: '300px' }}>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: colors.textSecondary }}
                      tickFormatter={(v: string) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: colors.textSecondary }}
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
        </div>

        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Weekly Heatmap</h2>
          <div style={chartContainerStyle}>
            <HeatmapChart data={heatmapData} />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Room Performance Comparison</h2>
        <div style={chartContainerStyle}>
          <RoomComparisonTable dateRange={dateRange} />
        </div>
      </div>
    </div>
  );
};

const HeatmapChart: React.FC<{ data: HeatmapCell[] }> = ({ data }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7-18

  // Build lookup for quick access
  const lookup = new Map<string, number>();
  let maxVal = 1;
  data.forEach((cell) => {
    lookup.set(`${cell.day}-${cell.hour}`, cell.value);
    if (cell.value > maxVal) maxVal = cell.value;
  });

  const getCellColor = (day: string, hour: number) => {
    const val = lookup.get(`${day}-${hour}`) || 0;
    const intensity = val / maxVal;
    if (intensity === 0) return colors.backgroundSecondary;
    if (intensity < 0.33) return colors.successLight;
    if (intensity < 0.66) return colors.warningLight;
    return colors.primaryLight;
  };

  const formatHour = (h: number) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h;
    return `${hr}${suffix}`;
  };

  if (data.length === 0) {
    return (
      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary }}>
        No heatmap data available
      </div>
    );
  }

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
            {formatHour(hour)}
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
              title={`${day} ${formatHour(hour)}: ${lookup.get(`${day}-${hour}`) || 0} bookings`}
              style={{
                width: '40px',
                height: '30px',
                backgroundColor: getCellColor(day, hour),
                borderRadius: borderRadius.sm,
                cursor: 'default',
              }}
            />
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, paddingLeft: '50px' }}>
        <span style={{ fontSize: typography.fontSize.xs, color: colors.textSecondary }}>Low</span>
        {[colors.backgroundSecondary, colors.successLight, colors.warningLight, colors.primaryLight].map((c, i) => (
          <div key={i} style={{ width: '20px', height: '12px', backgroundColor: c, borderRadius: borderRadius.sm }} />
        ))}
        <span style={{ fontSize: typography.fontSize.xs, color: colors.textSecondary }}>High</span>
      </div>
    </div>
  );
};

const RoomComparisonTable: React.FC<{ dateRange: DateRange }> = ({ dateRange }) => {
  const [comparisonData, setComparisonData] = useState<RoomComparison[]>([]);

  useEffect(() => {
    fetchRoomComparison([], dateRange).then(setComparisonData).catch(console.error);
  }, [dateRange]);

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
        {comparisonData.map((room) => (
          <tr key={room.roomName}>
            <td style={tdStyle}>{room.roomName}</td>
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

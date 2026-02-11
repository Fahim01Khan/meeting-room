'use client';

import React, { useState, useEffect } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';
import type { DateRange, KPIData } from '../../types/analytics';
import { DateRangePicker } from '../../components/DateRangePicker';
import { KPIStat } from '../../components/KPIStat';
import { fetchGhostingData } from '../../services/analytics';

export const GhostingView: React.FC = () => {
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

  // Ghosting data from API
  const [ghostingStats, setGhostingStats] = useState<KPIData[]>([]);
  const [topOffenders, setTopOffenders] = useState<{ room: string; ghostRate: number; noShows: number; wastedMins: number }[]>([]);

  useEffect(() => {
    fetchGhostingData(dateRange)
      .then((data) => {
        // Derive KPI summary cards
        const totalBookings = data.reduce((s, d) => s + d.totalBookings, 0);
        const totalNoShows = data.reduce((s, d) => s + d.totalNoShows, 0);
        const avgRate = totalBookings > 0 ? Math.round((totalNoShows / totalBookings) * 100) : 0;
        const totalWastedHours = Math.round(data.reduce((s, d) => s + d.averageWastedMinutes * d.totalNoShows, 0) / 60);

        setGhostingStats([
          { label: 'Ghosting Rate', value: `${avgRate}%`, changeType: 'neutral' },
          { label: 'No-Shows', value: totalNoShows, changeType: 'negative' },
          { label: 'Wasted Hours', value: `${totalWastedHours}h`, changeType: 'negative' },
          { label: 'Rooms Tracked', value: data.length, changeType: 'neutral' },
        ]);

        // Top offenders table
        const sorted = [...data].sort((a, b) => b.ghostingRate - a.ghostingRate);
        setTopOffenders(
          sorted.slice(0, 5).map((d) => ({
            room: d.roomName,
            ghostRate: d.ghostingRate,
            noShows: d.totalNoShows,
            wastedMins: Math.round(d.averageWastedMinutes * d.totalNoShows),
          })),
        );
      })
      .catch(console.error);
  }, [dateRange]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Ghosting Analysis</h1>
          <p style={subtitleStyle}>Track no-shows and recover lost meeting time</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div style={kpiGridStyle}>
        {ghostingStats.map((stat, index) => (
          <KPIStat key={index} data={stat} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: spacing.lg }}>
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Ghosting Trend</h2>
          <div style={chartPlaceholderStyle}>
            <div style={{ textAlign: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5">
                <path d="M3 3v18h18" />
                <path d="M7 13l4-4 4 4 5-7" />
              </svg>
              <p style={{ marginTop: spacing.sm, fontSize: typography.fontSize.sm }}>
                Ghosting rate over time
              </p>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>By Department</h2>
          <div style={chartPlaceholderStyle}>
            <DepartmentBreakdown />
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Rooms with Highest Ghosting Rates</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Room</th>
              <th style={thStyle}>Ghosting Rate</th>
              <th style={thStyle}>No-Shows</th>
              <th style={thStyle}>Wasted Time</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {topOffenders.map((room) => (
              <tr key={room.room}>
                <td style={tdStyle}>{room.room}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      color: room.ghostRate > 25 ? colors.error : room.ghostRate > 15 ? colors.warning : colors.success,
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    {room.ghostRate}%
                  </span>
                </td>
                <td style={tdStyle}>{room.noShows}</td>
                <td style={tdStyle}>{Math.floor(room.wastedMins / 60)}h {room.wastedMins % 60}m</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: borderRadius.full,
                      fontSize: typography.fontSize.xs,
                      backgroundColor: room.ghostRate > 25 ? colors.errorLight : room.ghostRate > 15 ? colors.warningLight : colors.successLight,
                      color: room.ghostRate > 25 ? colors.error : room.ghostRate > 15 ? colors.warning : colors.success,
                    }}
                  >
                    {room.ghostRate > 25 ? 'Critical' : room.ghostRate > 15 ? 'Warning' : 'Good'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Recommendations</h2>
        <div style={{ display: 'grid', gap: spacing.md }}>
          {[
            { title: 'Implement check-in reminders', description: 'Send automated reminders 5 minutes before meetings' },
            { title: 'Auto-release policy', description: 'Release rooms after 15 minutes of no-show' },
            { title: 'Department awareness', description: 'Share ghosting metrics with team leads' },
          ].map((rec, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: spacing.md,
                padding: spacing.md,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.primaryLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
              <div>
                <p style={{ fontWeight: typography.fontWeight.medium, color: colors.text, marginBottom: spacing.xs }}>
                  {rec.title}
                </p>
                <p style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
                  {rec.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DepartmentBreakdown: React.FC = () => {
  const departments = [
    { name: 'Engineering', rate: 22 },
    { name: 'Sales', rate: 28 },
    { name: 'Marketing', rate: 15 },
    { name: 'HR', rate: 12 },
    { name: 'Finance', rate: 18 },
  ];

  return (
    <div style={{ width: '100%', padding: spacing.md }}>
      {departments.map((dept) => (
        <div key={dept.name} style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.sm }}>
          <div style={{ width: '80px', fontSize: typography.fontSize.xs, color: colors.textSecondary }}>
            {dept.name}
          </div>
          <div style={{ flex: 1, height: '16px', backgroundColor: colors.border, borderRadius: borderRadius.sm, overflow: 'hidden' }}>
            <div
              style={{
                width: `${dept.rate * 3}%`,
                height: '100%',
                backgroundColor: dept.rate > 25 ? colors.error : dept.rate > 15 ? colors.warning : colors.success,
              }}
            />
          </div>
          <div style={{ width: '40px', textAlign: 'right', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium }}>
            {dept.rate}%
          </div>
        </div>
      ))}
    </div>
  );
};

export default GhostingView;

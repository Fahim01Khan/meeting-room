'use client';

import React, { useState, useEffect } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';
import type { DateRange, KPIData } from '../../types/analytics';
import { DateRangePicker } from '../../components/DateRangePicker';
import { KPIStat } from '../../components/KPIStat';
import { fetchCapacityData } from '../../services/analytics';
import {
  PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

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

  // Capacity data from API
  const [capacityStats, setCapacityStats] = useState<KPIData[]>([]);
  const [roomCapacityData, setRoomCapacityData] = useState<{ room: string; capacity: number; avgAttendees: number; utilization: number }[]>([]);

  useEffect(() => {
    fetchCapacityData(dateRange)
      .then((data) => {
        // Derive KPI summary cards
        const totalOversized = data.reduce((s, d) => s + d.oversizedBookings, 0);
        const totalUndersized = data.reduce((s, d) => s + d.undersizedBookings, 0);
        const avgCapUtil = data.length > 0
          ? Math.round(data.reduce((s, d) => s + d.capacityUtilization, 0) / data.length)
          : 0;
        const totalBookings = totalOversized + totalUndersized + data.reduce((s, d) => s + Math.max(0, Math.round(d.averageAttendees)), 0);
        const rightSized = totalBookings > 0
          ? Math.round(((totalBookings - totalOversized - totalUndersized) / totalBookings) * 100)
          : 0;

        setCapacityStats([
          { label: 'Avg Capacity Used', value: `${avgCapUtil}%`, changeType: 'neutral' },
          { label: 'Oversized Bookings', value: totalOversized, changeType: 'negative' },
          { label: 'Undersized Bookings', value: totalUndersized, changeType: 'negative' },
          { label: 'Right-Sized Rate', value: `${rightSized}%`, changeType: 'positive' },
        ]);

        setRoomCapacityData(
          data.map((d) => ({
            room: d.roomName,
            capacity: d.roomCapacity,
            avgAttendees: d.averageAttendees,
            utilization: d.capacityUtilization,
          })),
        );
      })
      .catch(console.error);
  }, [dateRange]);

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
          <div style={{ height: '250px' }}>
            {roomCapacityData.length > 0 ? (() => {
              const oversized = roomCapacityData.filter((r) => r.avgAttendees < r.capacity * 0.5).length;
              const undersized = roomCapacityData.filter((r) => r.avgAttendees > r.capacity).length;
              const rightSized = roomCapacityData.length - oversized - undersized;
              const pieData = [
                { name: 'Right-Sized', value: rightSized, color: colors.success },
                { name: 'Oversized', value: oversized, color: colors.warning },
                { name: 'Undersized', value: undersized, color: colors.error },
              ].filter((d) => d.value > 0);
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: { name?: string; percent?: number }) => { if (!name || percent === undefined) return ''; return `${name} ${Math.round(percent * 100)}%`; }}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              );
            })() : (
              <div style={chartPlaceholderStyle}>No capacity data available</div>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Room Size vs Actual Usage</h2>
          <div style={{ height: '250px' }}>
            {roomCapacityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis
                    dataKey="capacity"
                    name="Capacity"
                    type="number"
                    tick={{ fontSize: 11, fill: colors.textSecondary }}
                    label={{ value: 'Room Capacity', position: 'insideBottom', offset: -5, fontSize: 11, fill: colors.textSecondary }}
                  />
                  <YAxis
                    dataKey="avgAttendees"
                    name="Avg Attendees"
                    type="number"
                    tick={{ fontSize: 11, fill: colors.textSecondary }}
                    label={{ value: 'Avg Attendees', angle: -90, position: 'insideLeft', fontSize: 11, fill: colors.textSecondary }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload as { room: string; capacity: number; avgAttendees: number };
                      return (
                        <div style={{ backgroundColor: colors.background, border: `1px solid ${colors.border}`, borderRadius: borderRadius.sm, padding: spacing.sm, fontSize: typography.fontSize.xs }}>
                          <p style={{ fontWeight: typography.fontWeight.semibold }}>{d.room}</p>
                          <p>Capacity: {d.capacity}</p>
                          <p>Avg Attendees: {d.avgAttendees}</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={roomCapacityData} fill={colors.primary} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div style={chartPlaceholderStyle}>No capacity data available</div>
            )}
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
          {(() => {
            const insights: { title: string; message: string; bg: string; border: string }[] = [];

            if (roomCapacityData.length > 0) {
              // Most oversized room (lowest capacity utilization)
              const sorted = [...roomCapacityData].sort((a, b) => a.utilization - b.utilization);
              const worst = sorted[0];
              if (worst.utilization < 50) {
                insights.push({
                  title: 'Oversized Room Usage',
                  message: `${worst.room} averages ${worst.avgAttendees} attendees for a capacity of ${worst.capacity} (${worst.utilization}% utilization). Consider promoting smaller rooms for these meetings.`,
                  bg: colors.warningLight,
                  border: colors.warning,
                });
              }

              // Best utilized room
              const best = sorted[sorted.length - 1];
              if (best.utilization >= 50) {
                insights.push({
                  title: 'Well-Utilized Rooms',
                  message: `${best.room} shows strong capacity usage at ${best.utilization}% with ${best.avgAttendees} avg attendees. Consider adding similar-sized rooms to meet demand.`,
                  bg: colors.successLight,
                  border: colors.success,
                });
              }
            }

            // Always show recommended action
            insights.push({
              title: 'Recommended Action',
              message: roomCapacityData.length > 0
                ? `With ${roomCapacityData.length} rooms tracked, implement room size recommendations during booking based on expected attendee count to improve overall capacity utilization.`
                : 'Start tracking room usage to generate optimization insights.',
              bg: colors.primaryLight,
              border: colors.primary,
            });

            return insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: spacing.lg,
                  backgroundColor: insight.bg,
                  borderRadius: borderRadius.md,
                  borderLeft: `4px solid ${insight.border}`,
                }}
              >
                <h3 style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text, marginBottom: spacing.sm }}>
                  {insight.title}
                </h3>
                <p style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
                  {insight.message}
                </p>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

export default CapacityView;

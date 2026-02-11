// Analytics-related API services

import { apiClient } from './api';
import type {
  UtilizationData,
  GhostingData,
  CapacityData,
  KPIData,
  DateRange,
  HeatmapCell,
  RoomComparison,
} from '../types/analytics';

function dateQs(dateRange: DateRange): string {
  return `startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
}

export const fetchUtilizationData = async (dateRange: DateRange): Promise<UtilizationData[]> => {
  const res = await apiClient.get<UtilizationData[]>(`/analytics/utilization?${dateQs(dateRange)}`);
  return res.data;
};

export const fetchGhostingData = async (dateRange: DateRange): Promise<GhostingData[]> => {
  const res = await apiClient.get<GhostingData[]>(`/analytics/ghosting?${dateQs(dateRange)}`);
  return res.data;
};

export const fetchCapacityData = async (dateRange: DateRange): Promise<CapacityData[]> => {
  const res = await apiClient.get<CapacityData[]>(`/analytics/capacity?${dateQs(dateRange)}`);
  return res.data;
};

export const fetchKPIData = async (dateRange: DateRange): Promise<KPIData[]> => {
  const res = await apiClient.get<KPIData[]>(`/analytics/kpi?${dateQs(dateRange)}`);
  return res.data;
};

export const fetchHeatmapData = async (
  dateRange: DateRange,
  _metric: 'utilization' | 'ghosting' | 'bookings',
): Promise<HeatmapCell[]> => {
  const res = await apiClient.get<HeatmapCell[]>(`/analytics/heatmap?${dateQs(dateRange)}`);
  return res.data;
};

export const fetchRoomComparison = async (
  roomIds: string[],
  dateRange: DateRange,
): Promise<RoomComparison[]> => {
  const qs = roomIds.length ? `&roomIds=${roomIds.join(',')}` : '';
  const res = await apiClient.get<RoomComparison[]>(
    `/analytics/rooms/compare?${dateQs(dateRange)}${qs}`,
  );
  return res.data;
};

export const fetchTrendData = async (
  metric: string,
  dateRange: DateRange,
): Promise<{ date: string; value: number }[]> => {
  const res = await apiClient.get<{ date: string; value: number }[]>(
    `/analytics/trends?${dateQs(dateRange)}&metric=${metric}`,
  );
  return res.data;
};

export const exportAnalyticsReport = async (
  dateRange: DateRange,
  format: 'csv' | 'pdf',
): Promise<Blob | null> => {
  if (format !== 'csv') return null; // Only CSV supported currently
  const res = await apiClient.get<Response>(
    `/analytics/export?${dateQs(dateRange)}&format=csv`,
  );
  // The apiClient returns the raw Response for non-JSON content-types
  const raw = res.data as unknown as Response;
  if (raw && typeof raw.blob === 'function') {
    return raw.blob();
  }
  return null;
};

// Analytics-related type definitions

export interface UtilizationData {
  roomId: string;
  roomName: string;
  utilizationRate: number;
  totalBookings: number;
  totalHoursBooked: number;
  peakHours: string[];
}

export interface GhostingData {
  roomId: string;
  roomName: string;
  ghostingRate: number;
  totalNoShows: number;
  totalBookings: number;
  averageWastedMinutes: number;
}

export interface CapacityData {
  roomId: string;
  roomName: string;
  roomCapacity: number;
  averageAttendees: number;
  capacityUtilization: number;
  oversizedBookings: number;
  undersizedBookings: number;
}

export interface KPIData {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  unit?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface HeatmapCell {
  day: string;
  hour: number;
  value: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface RoomComparison {
  roomId: string;
  roomName: string;
  utilization: number;
  ghosting: number;
  capacity: number;
  bookings: number;
}

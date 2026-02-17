/**
 * Room-related constants
 * 
 * These constants provide human-readable labels and icons for room statuses and amenities.
 */

import type { RoomStatus, Amenity } from '../types/room';

/**
 * Room status values.
 * Matches backend room status values.
 */
export const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance',
} as const;

/** Type for room status values */
export type RoomStatusValue = typeof ROOM_STATUS[keyof typeof ROOM_STATUS];

/**
 * Human-readable labels for room statuses.
 * 
 * @example
 * ROOM_STATUS_LABELS[ROOM_STATUS.AVAILABLE] // "Available"
 */
export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: 'Available',
  occupied: 'In Use',
  reserved: 'Reserved',
  maintenance: 'Under Maintenance',
} as const;

/**
 * Human-readable labels for room amenities.
 * Maps machine names to display names.
 * 
 * @example
 * AMENITY_LABELS.projector // "Projector"
 * AMENITY_LABELS.video_conference // "Video Conference"
 */
export const AMENITY_LABELS: Record<Amenity, string> = {
  projector: 'Projector',
  whiteboard: 'Whiteboard',
  video_conference: 'Video Conference',
  phone: 'Phone',
  tv_display: 'TV Display',
  air_conditioning: 'Air Conditioning',
} as const;

/**
 * Icon identifiers for room amenities.
 * These match common icon libraries (heroicons, lucide, etc.)
 * 
 * @example
 * AMENITY_ICONS.projector // "presentation-chart-bar"
 */
export const AMENITY_ICONS: Record<Amenity, string> = {
  projector: 'presentation-chart-bar',
  whiteboard: 'pencil-square',
  video_conference: 'video-camera',
  phone: 'phone',
  tv_display: 'tv',
  air_conditioning: 'wind',
} as const;

/**
 * Status color classes for room status indicators.
 * These align with theme color tokens.
 * 
 * @example
 * ROOM_STATUS_COLORS[ROOM_STATUS.AVAILABLE] // "success"
 */
export const ROOM_STATUS_COLORS: Record<RoomStatus, 'success' | 'error' | 'warning' | 'text'> = {
  available: 'success',
  occupied: 'error',
  reserved: 'warning',
  maintenance: 'text',
} as const;

/**
 * Capacity ranges for filtering.
 * 
 * @example
 * CAPACITY_OPTIONS[0] // { value: 2, label: "1-4 people" }
 */
export const CAPACITY_OPTIONS = [
  { value: 2, label: '1-4 people' },
  { value: 5, label: '5-8 people' },
  { value: 9, label: '9-12 people' },
  { value: 13, label: '13-20 people' },
  { value: 21, label: '20+ people' },
] as const;

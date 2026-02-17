/**
 * Booking-related constants
 * 
 * These constants match the backend BookingDefaults, BookingStatus, and RecurrenceType enums
 * to ensure consistency between frontend and backend.
 */

/**
 * Default values for booking configuration.
 * Matches backend BookingDefaults enum exactly.
 */
export const BOOKING_DEFAULTS = {
  /** Check-in window in minutes after meeting start time */
  CHECKIN_WINDOW_MINUTES: 15,
  /** Default meeting start time (HH:MM format) */
  DEFAULT_MEETING_START: '09:00',
  /** Default meeting end time (HH:MM format) */
  DEFAULT_MEETING_END: '10:00',
  /** Maximum booking duration in hours */
  MAX_BOOKING_DURATION_HOURS: 8,
  /** Minimum booking duration in minutes */
  MIN_BOOKING_DURATION_MINUTES: 15,
  /** Extension increment in minutes (must be multiple of this) */
  EXTENSION_INCREMENT_MINUTES: 15,
  /** Maximum number of extensions allowed per booking */
  MAX_EXTENSIONS_PER_BOOKING: 4,
  /** Business hours start (24-hour format) */
  BUSINESS_HOURS_START: 7,
  /** Business hours end (24-hour format) */
  BUSINESS_HOURS_END: 19,
  /** Duration of each time slot in minutes */
  TIME_SLOT_DURATION_MINUTES: 30,
} as const;

/**
 * Booking status values.
 * Matches backend BookingStatus enum exactly.
 * 
 * Status flow:
 * - pending → confirmed → checked_in → completed
 * - confirmed → cancelled
 * - confirmed → no_show (if not checked in within window)
 */
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

/**
 * Recurrence type values.
 * Matches backend RecurrenceType enum exactly.
 * 
 * @example
 * // Single booking
 * recurrenceType: RECURRENCE_TYPES.NONE
 * 
 * @example
 * // Weekly recurring on Mon/Wed/Fri
 * recurrenceType: RECURRENCE_TYPES.WEEKLY
 * recurrencePattern: { days: [0, 2, 4], interval: 1 }
 */
export const RECURRENCE_TYPES = {
  /** Single booking (non-recurring) */
  NONE: 'none',
  /** Repeat every N days */
  DAILY: 'daily',
  /** Repeat on specific days of week (Mon=0, Sun=6) */
  WEEKLY: 'weekly',
  /** Repeat on specific day of month (1-31) */
  MONTHLY: 'monthly',
  /** Advanced custom patterns */
  CUSTOM: 'custom',
} as const;

/** Type for booking status values */
export type BookingStatusValue = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

/** Type for recurrence type values */
export type RecurrenceTypeValue = typeof RECURRENCE_TYPES[keyof typeof RECURRENCE_TYPES];

/**
 * Human-readable labels for booking statuses.
 * 
 * @example
 * BOOKING_STATUS_LABELS[BOOKING_STATUS.CONFIRMED] // "Confirmed"
 */
export const BOOKING_STATUS_LABELS: Record<BookingStatusValue, string> = {
  [BOOKING_STATUS.PENDING]: 'Pending',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.CHECKED_IN]: 'Checked In',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.NO_SHOW]: 'No Show',
} as const;

/**
 * Human-readable labels for recurrence types.
 * 
 * @example
 * RECURRENCE_TYPE_LABELS[RECURRENCE_TYPES.WEEKLY] // "Weekly"
 */
export const RECURRENCE_TYPE_LABELS: Record<RecurrenceTypeValue, string> = {
  [RECURRENCE_TYPES.NONE]: 'Does not repeat',
  [RECURRENCE_TYPES.DAILY]: 'Daily',
  [RECURRENCE_TYPES.WEEKLY]: 'Weekly',
  [RECURRENCE_TYPES.MONTHLY]: 'Monthly',
  [RECURRENCE_TYPES.CUSTOM]: 'Custom',
} as const;

/**
 * Validation utility functions
 * 
 * These functions validate user input and business rules for bookings and forms.
 * All validators return a ValidationResult with isValid flag and optional error message.
 */

import { BOOKING_DEFAULTS } from '../constants/booking';
import { getDurationMinutes } from './datetime';

/**
 * Result of a validation check.
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Validate booking start and end times.
 * 
 * Checks:
 * - End time is after start time
 * - Duration meets minimum requirement
 * - Duration does not exceed maximum
 * - Times are within business hours
 * 
 * @param startTime - Start time ISO string
 * @param endTime - End time ISO string
 * @returns Validation result
 * 
 * @example
 * validateBookingTimes("2026-02-17T09:00:00Z", "2026-02-17T10:00:00Z")
 * // { isValid: true }
 * 
 * @example
 * validateBookingTimes("2026-02-17T10:00:00Z", "2026-02-17T09:00:00Z")
 * // { isValid: false, error: "End time must be after start time" }
 */
export function validateBookingTimes(
  startTime: string,
  endTime: string
): ValidationResult {
  if (!startTime || !endTime) {
    return {
      isValid: false,
      error: 'Start and end times are required',
    };
  }
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Check valid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format',
    };
  }
  
  // Check end after start
  if (end <= start) {
    return {
      isValid: false,
      error: 'End time must be after start time',
    };
  }
  
  const durationMinutes = getDurationMinutes(startTime, endTime);
  
  // Check minimum duration
  if (durationMinutes < BOOKING_DEFAULTS.MIN_BOOKING_DURATION_MINUTES) {
    return {
      isValid: false,
      error: `Booking must be at least ${BOOKING_DEFAULTS.MIN_BOOKING_DURATION_MINUTES} minutes`,
    };
  }
  
  // Check maximum duration
  const maxDurationMinutes = BOOKING_DEFAULTS.MAX_BOOKING_DURATION_HOURS * 60;
  if (durationMinutes > maxDurationMinutes) {
    return {
      isValid: false,
      error: `Booking cannot exceed ${BOOKING_DEFAULTS.MAX_BOOKING_DURATION_HOURS} hours`,
    };
  }
  
  // Check business hours
  const startHour = start.getHours();
  const endHour = end.getHours();
  const endMinute = end.getMinutes();
  
  const businessStart = BOOKING_DEFAULTS.BUSINESS_HOURS_START;
  const businessEnd = BOOKING_DEFAULTS.BUSINESS_HOURS_END;
  
  if (startHour < businessStart) {
    return {
      isValid: false,
      error: `Bookings cannot start before ${businessStart}:00 AM`,
    };
  }
  
  // End time can be exactly at business end (e.g., 19:00) but not after
  const endTimeInMinutes = endHour * 60 + endMinute;
  const businessEndInMinutes = businessEnd * 60;
  
  if (endTimeInMinutes > businessEndInMinutes) {
    return {
      isValid: false,
      error: `Bookings cannot end after ${businessEnd}:00 (${formatHour(businessEnd)})`,
    };
  }
  
  return { isValid: true };
}

/**
 * Validate booking title.
 * 
 * Checks:
 * - Not empty
 * - Does not exceed maximum length (500 characters)
 * 
 * @param title - Booking title
 * @returns Validation result
 * 
 * @example
 * validateTitle("Sprint Planning") // { isValid: true }
 * validateTitle("") // { isValid: false, error: "Title is required" }
 */
export function validateTitle(title: string): ValidationResult {
  if (!title || title.trim() === '') {
    return {
      isValid: false,
      error: 'Title is required',
    };
  }
  
  const maxLength = 500;
  if (title.length > maxLength) {
    return {
      isValid: false,
      error: `Title cannot exceed ${maxLength} characters`,
    };
  }
  
  return { isValid: true };
}

/**
 * Validate that a required field has a value.
 * 
 * @param value - Field value to validate
 * @param fieldName - Name of the field for error message
 * @returns Validation result
 * 
 * @example
 * validateRequired("some value", "Room") // { isValid: true }
 * validateRequired("", "Room") // { isValid: false, error: "Room is required" }
 */
export function validateRequired(
  value: string | number | null | undefined,
  fieldName: string
): ValidationResult {
  if (value === null || value === undefined) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }
  
  return { isValid: true };
}

/**
 * Validate extension minutes.
 * 
 * Checks:
 * - Value is a multiple of 15 minutes
 * - Value is within allowed range (15-120 minutes)
 * 
 * @param minutes - Extension duration in minutes
 * @returns Validation result
 * 
 * @example
 * validateExtensionMinutes(15) // { isValid: true }
 * validateExtensionMinutes(30) // { isValid: true }
 * validateExtensionMinutes(10) // { isValid: false, error: "..." }
 * validateExtensionMinutes(150) // { isValid: false, error: "..." }
 */
export function validateExtensionMinutes(minutes: number): ValidationResult {
  const increment = BOOKING_DEFAULTS.EXTENSION_INCREMENT_MINUTES;
  const minExtension = increment;
  const maxExtension = 120;
  
  if (minutes < minExtension || minutes > maxExtension) {
    return {
      isValid: false,
      error: `Extension must be between ${minExtension} and ${maxExtension} minutes`,
    };
  }
  
  if (minutes % increment !== 0) {
    return {
      isValid: false,
      error: `Extension must be in ${increment}-minute increments`,
    };
  }
  
  return { isValid: true };
}

/**
 * Validate email address format.
 * 
 * @param email - Email address to validate
 * @returns Validation result
 * 
 * @example
 * validateEmail("user@example.com") // { isValid: true }
 * validateEmail("invalid-email") // { isValid: false, error: "..." }
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: 'Email is required',
    };
  }
  
  // Simple email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Invalid email address',
    };
  }
  
  return { isValid: true };
}

/**
 * Validate room capacity.
 * 
 * @param capacity - Room capacity number
 * @returns Validation result
 * 
 * @example
 * validateCapacity(10) // { isValid: true }
 * validateCapacity(-5) // { isValid: false, error: "..." }
 */
export function validateCapacity(capacity: number): ValidationResult {
  if (capacity < 1) {
    return {
      isValid: false,
      error: 'Capacity must be at least 1',
    };
  }
  
  if (capacity > 1000) {
    return {
      isValid: false,
      error: 'Capacity cannot exceed 1000',
    };
  }
  
  return { isValid: true };
}

/**
 * Validate that a date is not in the past.
 * 
 * @param dateISO - ISO date string to validate
 * @returns Validation result
 * 
 * @example
 * validateFutureDate("2026-12-31") // { isValid: true }
 * validateFutureDate("2020-01-01") // { isValid: false, error: "..." }
 */
export function validateFutureDate(dateISO: string): ValidationResult {
  if (!dateISO) {
    return {
      isValid: false,
      error: 'Date is required',
    };
  }
  
  const date = new Date(dateISO);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format',
    };
  }
  
  if (date < today) {
    return {
      isValid: false,
      error: 'Date cannot be in the past',
    };
  }
  
  return { isValid: true };
}

/**
 * Combine multiple validation results.
 * Returns the first error found, or success if all pass.
 * 
 * @param results - Array of validation results to combine
 * @returns Combined validation result
 * 
 * @example
 * combineValidations([
 *   validateTitle("Meeting"),
 *   validateRequired(roomId, "Room")
 * ]) // { isValid: true } if both pass
 */
export function combineValidations(results: ValidationResult[]): ValidationResult {
  for (const result of results) {
    if (!result.isValid) {
      return result;
    }
  }
  
  return { isValid: true };
}

/**
 * Helper function to format hour in 12-hour format.
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

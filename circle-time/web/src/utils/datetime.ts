/**
 * Date and time utility functions
 * 
 * These functions handle date/time formatting, parsing, and calculations
 * using native JavaScript Date API only (no external dependencies).
 */

import { BOOKING_DEFAULTS } from '../constants/booking';

/** Format options for datetime formatting */
export type DateTimeFormat = 'date' | 'time' | 'datetime' | 'relative';

/**
 * Format an ISO datetime string to human-readable format.
 * 
 * @param isoString - ISO 8601 datetime string (e.g., "2026-02-17T14:30:00Z")
 * @param format - Output format type
 * @returns Formatted datetime string
 * 
 * @example
 * formatDateTime("2026-02-17T14:30:00Z", "date") // "Feb 17, 2026"
 * formatDateTime("2026-02-17T14:30:00Z", "time") // "2:30 PM"
 * formatDateTime("2026-02-17T14:30:00Z", "datetime") // "Feb 17, 2026 at 2:30 PM"
 * formatDateTime("2026-02-17T14:30:00Z", "relative") // "in 2 hours"
 */
export function formatDateTime(
  isoString: string,
  format: DateTimeFormat = 'datetime'
): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  switch (format) {
    case 'date':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      
    case 'time':
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      
    case 'datetime':
      return `${formatDateTime(isoString, 'date')} at ${formatDateTime(isoString, 'time')}`;
      
    case 'relative':
      return formatRelativeTime(date);
      
    default:
      return isoString;
  }
}

/**
 * Extract time in HH:MM format from ISO datetime string.
 * 
 * @param isoString - ISO 8601 datetime string
 * @returns Time string in HH:MM format
 * 
 * @example
 * getTimeFromISO("2026-02-17T14:30:00Z") // "14:30"
 * getTimeFromISO("2026-02-17T09:05:00Z") // "09:05"
 */
export function getTimeFromISO(isoString: string): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Extract date in YYYY-MM-DD format from ISO datetime string.
 * 
 * @param isoString - ISO 8601 datetime string
 * @returns Date string in YYYY-MM-DD format
 * 
 * @example
 * getDateFromISO("2026-02-17T14:30:00Z") // "2026-02-17"
 */
export function getDateFromISO(isoString: string): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Calculate duration between two ISO datetime strings in minutes.
 * 
 * @param startISO - Start datetime ISO string
 * @param endISO - End datetime ISO string
 * @returns Duration in minutes
 * 
 * @example
 * getDurationMinutes("2026-02-17T14:00:00Z", "2026-02-17T15:30:00Z") // 90
 */
export function getDurationMinutes(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0;
  
  const start = new Date(startISO);
  const end = new Date(endISO);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }
  
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60));
}

/**
 * Format duration in minutes to human-readable string.
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 * 
 * @example
 * formatDuration(30) // "30m"
 * formatDuration(90) // "1h 30m"
 * formatDuration(120) // "2h"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Check if an ISO datetime is today.
 * 
 * @param isoString - ISO 8601 datetime string
 * @returns True if date is today
 * 
 * @example
 * isToday("2026-02-17T14:30:00Z") // true (if today is Feb 17, 2026)
 */
export function isToday(isoString: string): boolean {
  if (!isoString) return false;
  
  const date = new Date(isoString);
  
  if (isNaN(date.getTime())) {
    return false;
  }
  
  const today = new Date();
  
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Check if an ISO datetime is in the future.
 * 
 * @param isoString - ISO 8601 datetime string
 * @returns True if datetime is in the future
 * 
 * @example
 * isFuture("2026-12-31T23:59:59Z") // true (if current date is before this)
 */
export function isFuture(isoString: string): boolean {
  if (!isoString) return false;
  
  const date = new Date(isoString);
  
  if (isNaN(date.getTime())) {
    return false;
  }
  
  return date.getTime() > Date.now();
}

/**
 * Check if an ISO datetime is in the past.
 * 
 * @param isoString - ISO 8601 datetime string
 * @returns True if datetime is in the past
 * 
 * @example
 * isPast("2026-01-01T00:00:00Z") // true (if current date is after this)
 */
export function isPast(isoString: string): boolean {
  if (!isoString) return false;
  
  const date = new Date(isoString);
  
  if (isNaN(date.getTime())) {
    return false;
  }
  
  return date.getTime() < Date.now();
}

/**
 * Format a time range from two ISO datetime strings.
 * 
 * @param startISO - Start datetime ISO string
 * @param endISO - End datetime ISO string
 * @returns Formatted time range string
 * 
 * @example
 * formatTimeRange("2026-02-17T09:00:00Z", "2026-02-17T10:30:00Z") // "9:00 AM - 10:30 AM"
 */
export function formatTimeRange(startISO: string, endISO: string): string {
  if (!startISO || !endISO) return '';
  
  const startTime = formatDateTime(startISO, 'time');
  const endTime = formatDateTime(endISO, 'time');
  
  if (!startTime || !endTime) return '';
  
  return `${startTime} - ${endTime}`;
}

/**
 * Format relative time from now (e.g., "2 hours ago", "in 3 days").
 * 
 * @param date - Date object to format
 * @returns Relative time string
 * 
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 * formatRelativeTime(new Date(Date.now() + 7200000)) // "in 2 hours"
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const isPast = diffMs < 0;
  
  // Less than 1 minute
  if (diffSeconds < 60) {
    return isPast ? 'just now' : 'in a moment';
  }
  
  // Less than 1 hour
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return isPast
      ? `${minutes} minute${minutes > 1 ? 's' : ''} ago`
      : `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  
  // Less than 1 day
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return isPast
      ? `${hours} hour${hours > 1 ? 's' : ''} ago`
      : `in ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  // Less than 1 week
  if (diffSeconds < 604800) {
    const days = Math.floor(diffSeconds / 86400);
    return isPast
      ? `${days} day${days > 1 ? 's' : ''} ago`
      : `in ${days} day${days > 1 ? 's' : ''}`;
  }
  
  // Default to formatted date
  return formatDateTime(date.toISOString(), 'date');
}

/**
 * Get business hours for a given date.
 * Uses BOOKING_DEFAULTS for start and end hours.
 * 
 * @param dateISO - ISO date string (YYYY-MM-DD)
 * @returns Object with start and end ISO strings for business hours
 * 
 * @example
 * getBusinessHours("2026-02-17") // { start: "2026-02-17T07:00:00", end: "2026-02-17T19:00:00" }
 */
export function getBusinessHours(dateISO: string): { start: string; end: string } {
  const startHour = BOOKING_DEFAULTS.BUSINESS_HOURS_START;
  const endHour = BOOKING_DEFAULTS.BUSINESS_HOURS_END;
  
  return {
    start: `${dateISO}T${startHour.toString().padStart(2, '0')}:00:00`,
    end: `${dateISO}T${endHour.toString().padStart(2, '0')}:00:00`,
  };
}

/**
 * Get current date in YYYY-MM-DD format.
 * 
 * @returns Current date string
 * 
 * @example
 * getCurrentDate() // "2026-02-17"
 */
export function getCurrentDate(): string {
  return getDateFromISO(new Date().toISOString());
}

/**
 * Get current time in HH:MM format.
 * 
 * @returns Current time string
 * 
 * @example
 * getCurrentTime() // "14:30"
 */
export function getCurrentTime(): string {
  return getTimeFromISO(new Date().toISOString());
}

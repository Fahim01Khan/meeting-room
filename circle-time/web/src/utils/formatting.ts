/**
 * Formatting utility functions
 * 
 * These functions handle formatting of various data types for display purposes.
 */

import type { RoomStatus, Amenity } from '../types/room';
import type { BookingStatusValue } from '../constants/booking';
import { ROOM_STATUS_LABELS, AMENITY_LABELS } from '../constants/room';
import { BOOKING_STATUS_LABELS } from '../constants/booking';

/**
 * Format room status to human-readable string.
 * 
 * @param status - Room status value
 * @returns Human-readable status string
 * 
 * @example
 * formatRoomStatus("available") // "Available"
 * formatRoomStatus("maintenance") // "Under Maintenance"
 */
export function formatRoomStatus(status: RoomStatus): string {
  return ROOM_STATUS_LABELS[status] || status;
}

/**
 * Format room capacity to human-readable string.
 * 
 * @param capacity - Room capacity number
 * @returns Formatted capacity string
 * 
 * @example
 * formatCapacity(10) // "Seats 10 people"
 * formatCapacity(1) // "Seats 1 person"
 */
export function formatCapacity(capacity: number): string {
  if (capacity <= 0) {
    return 'No capacity information';
  }
  
  return `Seats ${capacity} ${capacity === 1 ? 'person' : 'people'}`;
}

/**
 * Format a single amenity to human-readable string.
 * 
 * @param amenity - Amenity machine name
 * @returns Human-readable amenity label
 * 
 * @example
 * formatAmenity("projector") // "Projector"
 * formatAmenity("video_conference") // "Video Conference"
 */
export function formatAmenity(amenity: Amenity): string {
  return AMENITY_LABELS[amenity] || amenity;
}

/**
 * Format a list of amenities to comma-separated string.
 * 
 * @param amenities - Array of amenity machine names
 * @param maxDisplay - Maximum number of amenities to display before truncating
 * @returns Comma-separated amenity labels
 * 
 * @example
 * formatAmenityList(["projector", "whiteboard"]) // "Projector, Whiteboard"
 * formatAmenityList(["projector", "whiteboard", "phone"], 2) // "Projector, Whiteboard, +1 more"
 */
export function formatAmenityList(amenities: Amenity[], maxDisplay?: number): string {
  if (!amenities || amenities.length === 0) {
    return 'No amenities';
  }
  
  const formatted = amenities.map(formatAmenity);
  
  if (maxDisplay && formatted.length > maxDisplay) {
    const visible = formatted.slice(0, maxDisplay);
    const remaining = formatted.length - maxDisplay;
    return `${visible.join(', ')}, +${remaining} more`;
  }
  
  return formatted.join(', ');
}

/**
 * Truncate text to maximum length with ellipsis.
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length including ellipsis
 * @returns Truncated text with ellipsis if needed
 * 
 * @example
 * truncateText("This is a very long meeting title", 20) // "This is a very lo..."
 * truncateText("Short", 20) // "Short"
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format booking status to human-readable string.
 * 
 * @param status - Booking status value
 * @returns Human-readable status string
 * 
 * @example
 * formatBookingStatus("confirmed") // "Confirmed"
 * formatBookingStatus("checked_in") // "Checked In"
 */
export function formatBookingStatus(status: BookingStatusValue): string {
  return BOOKING_STATUS_LABELS[status] || status;
}

/**
 * Format user name with fallback for empty/null values.
 * 
 * @param name - User's name
 * @returns Formatted name or placeholder
 * 
 * @example
 * formatUserName("John Doe") // "John Doe"
 * formatUserName("") // "Unknown User"
 * formatUserName(null) // "Unknown User"
 */
export function formatUserName(name: string | null | undefined): string {
  if (!name || name.trim() === '') {
    return 'Unknown User';
  }
  
  return name.trim();
}

/**
 * Format a list of user names to comma-separated string.
 * 
 * @param names - Array of user names
 * @param maxDisplay - Maximum number of names to display before truncating
 * @returns Comma-separated names
 * 
 * @example
 * formatUserList(["Alice", "Bob", "Charlie"]) // "Alice, Bob, Charlie"
 * formatUserList(["Alice", "Bob", "Charlie"], 2) // "Alice, Bob, +1 more"
 */
export function formatUserList(names: string[], maxDisplay?: number): string {
  if (!names || names.length === 0) {
    return 'No attendees';
  }
  
  const formatted = names.map(formatUserName);
  
  if (maxDisplay && formatted.length > maxDisplay) {
    const visible = formatted.slice(0, maxDisplay);
    const remaining = formatted.length - maxDisplay;
    return `${visible.join(', ')}, +${remaining} more`;
  }
  
  return formatted.join(', ');
}

/**
 * Format a number with thousands separators.
 * 
 * @param value - Number to format
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(42) // "42"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Format building and floor information.
 * 
 * @param building - Building name
 * @param floor - Floor number
 * @returns Formatted location string
 * 
 * @example
 * formatLocation("Main Building", 3) // "Main Building, Floor 3"
 * formatLocation("Annex", 1) // "Annex, Floor 1"
 */
export function formatLocation(building: string, floor: number): string {
  return `${building}, Floor ${floor}`;
}

/**
 * Format email address for display (truncate if too long).
 * 
 * @param email - Email address
 * @param maxLength - Maximum length before truncation
 * @returns Formatted email
 * 
 * @example
 * formatEmail("john.doe@example.com") // "john.doe@example.com"
 * formatEmail("very.long.email.address@company.com", 20) // "very.long.email.a..."
 */
export function formatEmail(email: string, maxLength: number = 30): string {
  if (!email) return '';
  
  return truncateText(email, maxLength);
}

/**
 * Format department name with fallback.
 * 
 * @param department - Department name
 * @returns Formatted department or placeholder
 * 
 * @example
 * formatDepartment("Engineering") // "Engineering"
 * formatDepartment("") // "No Department"
 */
export function formatDepartment(department: string | null | undefined): string {
  if (!department || department.trim() === '') {
    return 'No Department';
  }
  
  return department.trim();
}

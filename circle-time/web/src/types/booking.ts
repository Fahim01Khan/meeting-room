// Booking-related type definitions

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  description?: string;
  organizer: User;
  attendees: User[];
  startTime: string;
  endTime: string;
  status: BookingStatus;
  checkedIn: boolean;
  checkedInAt?: string;
}

export type BookingStatus =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "completed"
  | "no_show"
  | "checked_in";

export interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export interface BookingRequest {
  roomId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendeeIds: string[];
  attendeeCount?: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface BookingValidation {
  isValid: boolean;
  errors: string[];
}

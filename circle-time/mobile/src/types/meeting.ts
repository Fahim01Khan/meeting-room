// Meeting-related type definitions for Panel App

export interface Meeting {
  id: string;
  title: string;
  organizer: string;
  organizerEmail: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  checkedIn: boolean;
  checkedInAt?: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
}

export type RoomStatus = "available" | "occupied" | "upcoming" | "offline";

export interface RoomState {
  room: RoomInfo;
  status: RoomStatus;
  currentMeeting: Meeting | null;
  nextMeeting: Meeting | null;
  upcomingMeetings: Meeting[];
  lastUpdated: string;
}

export interface CheckInResult {
  success: boolean;
  message?: string;
}

export interface AdHocBookingResult {
  success: boolean;
  message?: string;
  data?: Meeting;
}

export interface EndMeetingResult {
  success: boolean;
  message?: string;
  freedMinutes?: number;
}

export type ScreenType =
  | "idle"
  | "meeting"
  | "checkin"
  | "endEarly"
  | "adHocBooking"
  | "pairing"
  | "calendar-select";

// Pairing types

export interface PairingCodeResult {
  success: boolean;
  message?: string;
  data?: {
    code: string;
    expiresAt: string;
  };
}

export interface PairingStatusResult {
  success: boolean;
  message?: string;
  data?: {
    status: "pending" | "paired" | "expired";
    roomId: string | null;
    roomName: string | null;
  };
}

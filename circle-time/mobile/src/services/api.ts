// API service for Panel App
//
// For local development:
//   Emulator: run `adb reverse tcp:8000 tcp:8000`, then use http://localhost:8000/api
//   Physical device on Wi-Fi: replace with your laptop's LAN IP, e.g. http://192.168.1.42:8000/api

import type { RoomState, CheckInResult, EndMeetingResult } from '../types/meeting';

const API_BASE_URL = 'http://10.0.2.2:8000/api'; // Android emulator → host machine

export const fetchRoomState = async (roomId: string): Promise<RoomState | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/state`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as RoomState) : null;
  } catch (err) {
    console.error('fetchRoomState error:', err);
    return null;
  }
};

export const checkInMeeting = async (meetingId: string): Promise<CheckInResult> => {
  try {
    const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as CheckInResult;
    }
    return { success: false, message: json.message || 'Check-in failed' };
  } catch (err) {
    console.error('checkInMeeting error:', err);
    return { success: false, message: 'Network error' };
  }
};

export const endMeetingEarly = async (meetingId: string): Promise<EndMeetingResult> => {
  try {
    const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as EndMeetingResult;
    }
    return { success: false, message: json.message || 'Failed to end meeting' };
  } catch (err) {
    console.error('endMeetingEarly error:', err);
    return { success: false, message: 'Network error' };
  }
};

export const reportRoomIssue = async (roomId: string, issue: string): Promise<boolean> => {
  // No backend endpoint yet — stub
  console.log(`Reporting issue for room ${roomId}: ${issue}`);
  return false;
};

export const extendMeeting = async (meetingId: string, minutes: number): Promise<boolean> => {
  // No backend endpoint yet — stub
  console.log(`Extending meeting ${meetingId} by ${minutes} minutes`);
  return false;
};

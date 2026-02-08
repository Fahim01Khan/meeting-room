// API service for Panel App

import type { RoomState, CheckInResult, EndMeetingResult } from '../types/meeting';

const API_BASE_URL = '/api';

export const fetchRoomState = async (roomId: string): Promise<RoomState | null> => {
  // TODO: wire data source
  console.log(`Fetching room state: ${roomId}`);
  return null;
};

export const checkInMeeting = async (meetingId: string): Promise<CheckInResult> => {
  // TODO: wire data source
  console.log(`Checking in meeting: ${meetingId}`);
  return {
    success: false,
    message: 'Not implemented',
  };
};

export const endMeetingEarly = async (meetingId: string): Promise<EndMeetingResult> => {
  // TODO: wire data source
  console.log(`Ending meeting early: ${meetingId}`);
  return {
    success: false,
    message: 'Not implemented',
  };
};

export const reportRoomIssue = async (roomId: string, issue: string): Promise<boolean> => {
  // TODO: wire data source
  console.log(`Reporting issue for room ${roomId}: ${issue}`);
  return false;
};

export const extendMeeting = async (meetingId: string, minutes: number): Promise<boolean> => {
  // TODO: wire data source
  console.log(`Extending meeting ${meetingId} by ${minutes} minutes`);
  return false;
};

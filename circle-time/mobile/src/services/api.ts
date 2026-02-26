// API service for Panel App
//
// For local development:
//   Physical device on Wi-Fi: Update API_BASE_URL in .env to your laptop's LAN IP
//   Emulator:                  run `adb reverse tcp:8000 tcp:8000`, then use http://localhost:8000/api in .env

import { API_BASE_URL as ENV_API_BASE_URL } from "@env";
import type {
  RoomState,
  CheckInResult,
  EndMeetingResult,
  AdHocBookingResult,
  Meeting,
  PairingCodeResult,
  PairingStatusResult,
} from "../types/meeting";

// TODO: Change to production URL before final deployment
const API_BASE_URL: string = ENV_API_BASE_URL || "http://10.10.30.71:8000/api";

export const fetchRoomState = async (
  roomId: string,
  deviceSerial?: string | null,
): Promise<RoomState | null> => {
  try {
    const headers: Record<string, string> = {};
    if (deviceSerial) {
      headers["X-Device-Serial"] = deviceSerial;
    }
    const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/state`, {
      headers,
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.unpaired) {
      // Signal that this device has been unpaired
      return { unpaired: true } as unknown as RoomState;
    }
    return json.success ? (json.data as RoomState) : null;
  } catch (err) {
    console.error("fetchRoomState error:", err);
    return null;
  }
};

export const checkInMeeting = async (
  meetingId: string,
): Promise<CheckInResult> => {
  try {
    const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (json.success) {
      return { success: true };
    }
    return { success: false, message: json.message || "Check-in failed" };
  } catch (err) {
    console.error("checkInMeeting error:", err);
    return { success: false, message: "Network error" };
  }
};

export const endMeetingEarly = async (
  meetingId: string,
): Promise<EndMeetingResult> => {
  try {
    const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (json.success) {
      return { success: true };
    }
    return { success: false, message: json.message || "Failed to end meeting" };
  } catch (err) {
    console.error("endMeetingEarly error:", err);
    return { success: false, message: "Network error" };
  }
};

export const bookAdHoc = async (
  roomId: string,
  durationMinutes: number,
): Promise<AdHocBookingResult> => {
  try {
    const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/book-adhoc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes }),
    });
    const json = await res.json();
    if (json.success && json.data) {
      return { success: true, data: json.data as Meeting };
    }
    return { success: false, message: json.message || "Booking failed" };
  } catch (err) {
    console.error("bookAdHoc error:", err);
    return { success: false, message: "Network error" };
  }
};

// ---------------------------------------------------------------------------
// Org settings
// ---------------------------------------------------------------------------

export interface OrgSettingsResult {
  orgName: string;
  primaryColour: string;
  logoUrl: string | null;
  checkinWindowMinutes: number;
}

export const fetchOrgSettings = async (): Promise<OrgSettingsResult | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/organisation/settings`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as OrgSettingsResult) : null;
  } catch (err) {
    console.error("fetchOrgSettings error:", err);
    return null;
  }
};

// ---------------------------------------------------------------------------
// Calendar OAuth
// ---------------------------------------------------------------------------

export const getCalendarAuthUrl = async (
  provider: "google" | "microsoft" | "zoho",
): Promise<string | null> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/auth/calendar-tokens/${provider}/auth-url`,
    );
    const json = await res.json();
    return json.success ? json.data.authUrl : null;
  } catch {
    return null;
  }
};

export const checkCalendarConnected = async (
  provider: string,
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/calendar-tokens`);
    const json = await res.json();
    if (!json.success) return false;
    return json.data.some((t: { provider: string }) => t.provider === provider);
  } catch {
    return false;
  }
};

export const reportRoomIssue = async (
  roomId: string,
  issue: string,
): Promise<boolean> => {
  // No backend endpoint yet — stub
  console.log(`Reporting issue for room ${roomId}: ${issue}`);
  return false;
};

export const extendMeeting = async (
  meetingId: string,
  minutes: number,
): Promise<boolean> => {
  // No backend endpoint yet — stub
  console.log(`Extending meeting ${meetingId} by ${minutes} minutes`);
  return false;
};

// ---------------------------------------------------------------------------
// Pairing
// ---------------------------------------------------------------------------

export const generatePairingCode = async (
  deviceSerial: string,
): Promise<PairingCodeResult> => {
  try {
    const res = await fetch(`${API_BASE_URL}/panel/pairing-codes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceSerial }),
    });
    const json = await res.json();
    if (json.success && json.data) {
      return {
        success: true,
        data: { code: json.data.code, expiresAt: json.data.expiresAt },
      };
    }
    return {
      success: false,
      message: json.message || "Failed to generate code",
    };
  } catch (err) {
    console.error("generatePairingCode error:", err);
    return { success: false, message: "Network error" };
  }
};

export const pollPairingStatus = async (
  code: string,
): Promise<PairingStatusResult> => {
  try {
    const res = await fetch(`${API_BASE_URL}/panel/pairing-status/${code}`);
    const json = await res.json();
    if (json.success && json.data) {
      return {
        success: true,
        data: {
          status: json.data.status,
          roomId: json.data.roomId,
          roomName: json.data.roomName,
        },
      };
    }
    return {
      success: false,
      message: json.message || "Failed to check status",
    };
  } catch (err) {
    console.error("pollPairingStatus error:", err);
    return { success: false, message: "Network error" };
  }
};

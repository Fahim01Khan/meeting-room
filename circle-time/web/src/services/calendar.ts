// Calendar OAuth API service

import { apiClient } from "./api";

export interface CalendarToken {
  provider: string;
  calendarId: string;
  tokenExpiry: string | null;
  connected: boolean;
  expired: boolean;
}

export async function fetchCalendarTokens(): Promise<CalendarToken[]> {
  const res = await apiClient.get<CalendarToken[]>("/auth/calendar-tokens");
  return res.data;
}

export async function getCalendarAuthUrl(
  provider: string,
): Promise<{ authUrl: string; state: string }> {
  const res = await apiClient.get<{ authUrl: string; state: string }>(
    `/auth/calendar-tokens/${provider}/auth-url`,
  );
  return res.data;
}

export async function disconnectCalendar(provider: string): Promise<void> {
  await apiClient.delete(`/auth/calendar-tokens/${provider}`);
}

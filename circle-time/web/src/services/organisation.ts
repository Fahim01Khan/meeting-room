// Organisation settings API service

import { apiClient } from "./api";

export interface OrgSettings {
  orgName: string;
  primaryColour: string;
  logoUrl: string | null;
  checkinWindowMinutes: number;
  autoReleaseMinutes: number;
  businessDays: number[]; // 0=Mon … 6=Sun
  businessStart: string; // "HH:MM"
  businessEnd: string; // "HH:MM"
  timezone: string;
  updatedAt: string | null;
}

export type OrgSettingsUpdate = Partial<Omit<OrgSettings, "updatedAt">>;

export async function fetchSettings(): Promise<OrgSettings> {
  const res = await apiClient.get<OrgSettings>("/organisation/settings");
  return res.data;
}

export async function updateSettings(
  data: OrgSettingsUpdate,
): Promise<OrgSettings> {
  const res = await apiClient.put<OrgSettings>("/organisation/settings", data);
  return res.data;
}

// Device management & pairing API service

import { apiClient } from "./api";

export interface DeviceRegistration {
  id: string;
  deviceSerial: string;
  roomId: string;
  roomName: string;
  roomBuilding: string;
  roomFloor: number;
  registeredAt: string;
  isActive: boolean;
}

export interface PairDeviceResult {
  roomId: string;
  roomName: string;
}

export const fetchDevices = async (): Promise<DeviceRegistration[]> => {
  const res = await apiClient.get<DeviceRegistration[]>("/panel/devices");
  return res.data;
};

export const pairDevice = async (
  code: string,
  roomId: string,
): Promise<PairDeviceResult> => {
  const res = await apiClient.post<PairDeviceResult>("/panel/pair-device", {
    code,
    roomId,
  });
  return res.data;
};

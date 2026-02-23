// Room-related API services

import { apiClient } from "./api";
import type { Room, RoomFilter, Building, FloorPlan } from "../types/room";

export const fetchRooms = async (): Promise<Room[]> => {
  const res = await apiClient.get<Room[]>("/rooms");
  return res.data;
};

export const fetchRoomById = async (roomId: string): Promise<Room | null> => {
  const res = await apiClient.get<Room>(`/rooms/${roomId}`);
  return res.data ?? null;
};

export const fetchRoomsFiltered = async (
  filters: RoomFilter,
): Promise<Room[]> => {
  const params = new URLSearchParams();
  if (filters.building) params.set("building", filters.building);
  if (filters.floor !== undefined) params.set("floor", String(filters.floor));
  if (filters.minCapacity !== undefined)
    params.set("minCapacity", String(filters.minCapacity));
  if (filters.amenities?.length)
    params.set("amenities", filters.amenities.join(","));
  if (filters.status) params.set("status", filters.status);
  if (filters.searchQuery) params.set("searchQuery", filters.searchQuery);

  const qs = params.toString();
  const res = await apiClient.get<Room[]>(`/rooms${qs ? `?${qs}` : ""}`);
  return res.data;
};

export const fetchBuildings = async (): Promise<Building[]> => {
  const res = await apiClient.get<Building[]>("/buildings");
  return res.data;
};

export const fetchFloorPlan = async (
  buildingId: string,
  floor: number,
): Promise<FloorPlan | null> => {
  const res = await apiClient.get<FloorPlan>(
    `/buildings/${buildingId}/floors/${floor}`,
  );
  return res.data ?? null;
};

export const searchRooms = async (query: string): Promise<Room[]> => {
  const res = await apiClient.get<Room[]>(
    `/rooms?searchQuery=${encodeURIComponent(query)}`,
  );
  return res.data;
};

export const fetchRoomAvailability = async (
  roomId: string,
  date: string,
): Promise<{ startTime: string; endTime: string; isAvailable: boolean }[]> => {
  const res = await apiClient.get<
    { startTime: string; endTime: string; isAvailable: boolean }[]
  >(`/rooms/${roomId}/availability?date=${date}`);
  return res.data;
};

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export interface RoomWritePayload {
  name: string;
  building: string;
  floor: number;
  capacity: number;
  amenities?: string[];
  status?: string;
}

export const createRoom = async (data: RoomWritePayload): Promise<Room> => {
  const res = await apiClient.post<Room>("/rooms/new", data);
  return res.data;
};

export const updateRoom = async (
  id: string,
  data: Partial<RoomWritePayload>,
): Promise<Room> => {
  const res = await apiClient.put<Room>(`/rooms/${id}/edit`, data);
  return res.data;
};

export const deleteRoom = async (id: string): Promise<void> => {
  await apiClient.delete(`/rooms/${id}/delete`);
};

export const fetchRooms = async (): Promise<Room[]> => {
  const res = await apiClient.get<Room[]>("/rooms");
  return res.data;
};

export const fetchRoomById = async (roomId: string): Promise<Room | null> => {
  const res = await apiClient.get<Room>(`/rooms/${roomId}`);
  return res.data ?? null;
};

export const fetchRoomsFiltered = async (
  filters: RoomFilter,
): Promise<Room[]> => {
  const params = new URLSearchParams();
  if (filters.building) params.set("building", filters.building);
  if (filters.floor !== undefined) params.set("floor", String(filters.floor));
  if (filters.minCapacity !== undefined)
    params.set("minCapacity", String(filters.minCapacity));
  if (filters.amenities?.length)
    params.set("amenities", filters.amenities.join(","));
  if (filters.status) params.set("status", filters.status);
  if (filters.searchQuery) params.set("searchQuery", filters.searchQuery);

  const qs = params.toString();
  const res = await apiClient.get<Room[]>(`/rooms${qs ? `?${qs}` : ""}`);
  return res.data;
};

export const fetchBuildings = async (): Promise<Building[]> => {
  const res = await apiClient.get<Building[]>("/buildings");
  return res.data;
};

export const fetchFloorPlan = async (
  buildingId: string,
  floor: number,
): Promise<FloorPlan | null> => {
  const res = await apiClient.get<FloorPlan>(
    `/buildings/${buildingId}/floors/${floor}`,
  );
  return res.data ?? null;
};

export const searchRooms = async (query: string): Promise<Room[]> => {
  const res = await apiClient.get<Room[]>(
    `/rooms?searchQuery=${encodeURIComponent(query)}`,
  );
  return res.data;
};

export const fetchRoomAvailability = async (
  roomId: string,
  date: string,
): Promise<{ startTime: string; endTime: string; isAvailable: boolean }[]> => {
  const res = await apiClient.get<
    { startTime: string; endTime: string; isAvailable: boolean }[]
  >(`/rooms/${roomId}/availability?date=${date}`);
  return res.data;
};

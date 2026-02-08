// Room-related API services

import type { Room, RoomFilter, Building, FloorPlan } from '../types/room';

export const fetchRooms = async (): Promise<Room[]> => {
  // TODO: wire data source
  return [];
};

export const fetchRoomById = async (roomId: string): Promise<Room | null> => {
  // TODO: wire data source
  console.log(`Fetching room: ${roomId}`);
  return null;
};

export const fetchRoomsFiltered = async (filters: RoomFilter): Promise<Room[]> => {
  // TODO: wire data source
  console.log('Filtering rooms:', filters);
  return [];
};

export const fetchBuildings = async (): Promise<Building[]> => {
  // TODO: wire data source
  return [];
};

export const fetchFloorPlan = async (buildingId: string, floor: number): Promise<FloorPlan | null> => {
  // TODO: wire data source
  console.log(`Fetching floor plan: ${buildingId}, floor ${floor}`);
  return null;
};

export const searchRooms = async (query: string): Promise<Room[]> => {
  // TODO: wire data source
  console.log(`Searching rooms: ${query}`);
  return [];
};

export const fetchRoomAvailability = async (
  roomId: string,
  date: string
): Promise<{ startTime: string; endTime: string; isAvailable: boolean }[]> => {
  // TODO: wire data source
  console.log(`Fetching availability: ${roomId} on ${date}`);
  return [];
};

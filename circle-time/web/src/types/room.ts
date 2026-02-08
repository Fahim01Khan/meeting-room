// Room-related type definitions

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  amenities: Amenity[];
  status: RoomStatus;
  imageUrl?: string;
}

export type Amenity =
  | 'projector'
  | 'whiteboard'
  | 'video_conference'
  | 'phone'
  | 'tv_display'
  | 'air_conditioning';

export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface RoomFilter {
  building?: string;
  floor?: number;
  minCapacity?: number;
  amenities?: Amenity[];
  status?: RoomStatus;
  searchQuery?: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  floors: number;
}

export interface FloorPlan {
  floorNumber: number;
  buildingId: string;
  svgData: string;
  rooms: FloorRoom[];
}

export interface FloorRoom {
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

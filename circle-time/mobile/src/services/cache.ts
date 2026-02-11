// Cache service for Panel App
// Provides offline support and data persistence
// Uses an in-memory cache; swap to AsyncStorage in production builds.

import type { RoomState } from '../types/meeting';

const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, string>();

function cacheKey(roomId: string): string {
  return `panel_cache_room_${roomId}`;
}

export const cacheRoomState = async (roomId: string, state: RoomState): Promise<void> => {
  try {
    const entry: CacheEntry<RoomState> = { data: state, timestamp: Date.now() };
    memoryCache.set(cacheKey(roomId), JSON.stringify(entry));
  } catch (error) {
    console.error('Failed to cache room state:', error);
  }
};

export const getCachedRoomState = async (roomId: string): Promise<RoomState | null> => {
  try {
    const raw = memoryCache.get(cacheKey(roomId));
    if (!raw) return null;

    const entry: CacheEntry<RoomState> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
      memoryCache.delete(cacheKey(roomId));
      return null;
    }
    return entry.data;
  } catch (error) {
    console.error('Failed to get cached room state:', error);
    return null;
  }
};

export const clearCache = async (): Promise<void> => {
  memoryCache.clear();
};

export const clearRoomCache = async (roomId: string): Promise<void> => {
  memoryCache.delete(cacheKey(roomId));
};

export const isCacheValid = async (roomId: string): Promise<boolean> => {
  const cached = await getCachedRoomState(roomId);
  return cached !== null;
};

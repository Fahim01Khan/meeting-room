// Cache service for Panel App
// Provides offline support and data persistence

import type { RoomState } from '../types/meeting';

const CACHE_KEY_PREFIX = 'panel_cache_';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const cacheRoomState = async (roomId: string, state: RoomState): Promise<void> => {
  // TODO: implement AsyncStorage or similar
  console.log(`Caching room state for: ${roomId}`);
  
  const entry: CacheEntry<RoomState> = {
    data: state,
    timestamp: Date.now(),
  };
  
  // Placeholder: In React Native, use AsyncStorage
  try {
    const key = `${CACHE_KEY_PREFIX}room_${roomId}`;
    // await AsyncStorage.setItem(key, JSON.stringify(entry));
    console.log(`Cached data with key: ${key}`);
  } catch (error) {
    console.error('Failed to cache room state:', error);
  }
};

export const getCachedRoomState = async (roomId: string): Promise<RoomState | null> => {
  // TODO: implement AsyncStorage or similar
  console.log(`Getting cached room state for: ${roomId}`);
  
  try {
    const key = `${CACHE_KEY_PREFIX}room_${roomId}`;
    // const cached = await AsyncStorage.getItem(key);
    const cached = null; // Placeholder
    
    if (!cached) {
      return null;
    }
    
    const entry: CacheEntry<RoomState> = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
      console.log('Cache expired');
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.error('Failed to get cached room state:', error);
    return null;
  }
};

export const clearCache = async (): Promise<void> => {
  // TODO: implement AsyncStorage clear
  console.log('Clearing all cache');
};

export const clearRoomCache = async (roomId: string): Promise<void> => {
  // TODO: implement AsyncStorage remove
  console.log(`Clearing cache for room: ${roomId}`);
  
  const key = `${CACHE_KEY_PREFIX}room_${roomId}`;
  // await AsyncStorage.removeItem(key);
};

export const isCacheValid = async (roomId: string): Promise<boolean> => {
  const cached = await getCachedRoomState(roomId);
  return cached !== null;
};

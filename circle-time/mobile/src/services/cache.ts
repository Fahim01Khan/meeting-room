// Cache service for Panel App
// Provides offline support and data persistence using AsyncStorage.

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RoomState } from "../types/meeting";

const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const KEY_PREFIX = "ct_cache_";

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

function cacheKey(roomId: string): string {
  return `${KEY_PREFIX}panel_room_${roomId}`;
}

export const cacheRoomState = async (
  roomId: string,
  state: RoomState,
): Promise<void> => {
  try {
    const entry: CacheEntry<RoomState> = {
      value: state,
      expiresAt: Date.now() + CACHE_EXPIRY_MS,
    };
    await AsyncStorage.setItem(cacheKey(roomId), JSON.stringify(entry));
  } catch (error) {
    console.error("Failed to cache room state:", error);
  }
};

export const getCachedRoomState = async (
  roomId: string,
): Promise<RoomState | null> => {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(roomId));
    if (!raw) return null;

    const entry: CacheEntry<RoomState> = JSON.parse(raw);
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(cacheKey(roomId));
      return null;
    }
    return entry.value;
  } catch (error) {
    console.error("Failed to get cached room state:", error);
    return null;
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(KEY_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error("Failed to clear cache:", error);
  }
};

export const clearRoomCache = async (roomId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(cacheKey(roomId));
  } catch (error) {
    console.error("Failed to clear room cache:", error);
  }
};

export const isCacheValid = async (roomId: string): Promise<boolean> => {
  const cached = await getCachedRoomState(roomId);
  return cached !== null;
};

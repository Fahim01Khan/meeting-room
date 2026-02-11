// Real-time update service for Panel App

import type { RoomState } from '../types/meeting';
import { fetchRoomState } from './api';

type RoomStateCallback = (state: RoomState) => void;

let pollingInterval: NodeJS.Timeout | null = null;
let subscribers: RoomStateCallback[] = [];
let currentRoomId: string | null = null;

export const subscribeToRoomUpdates = (
  roomId: string,
  callback: RoomStateCallback
): (() => void) => {
  currentRoomId = roomId;
  subscribers.push(callback);
  
  // Return unsubscribe function
  return () => {
    subscribers = subscribers.filter((cb) => cb !== callback);
  };
};

export const startPolling = (roomId: string, intervalMs: number = 30000): void => {
  currentRoomId = roomId;

  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  pollingInterval = setInterval(async () => {
    if (!currentRoomId) return;
    try {
      const state = await fetchRoomState(currentRoomId);
      if (state) {
        notifySubscribers(state);
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, intervalMs);
};

export const stopPolling = (): void => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  currentRoomId = null;
};

export const notifySubscribers = (state: RoomState): void => {
  subscribers.forEach((callback) => {
    try {
      callback(state);
    } catch (error) {
      console.error('Error notifying subscriber:', error);
    }
  });
};

export const isConnected = (): boolean => {
  return pollingInterval !== null;
};

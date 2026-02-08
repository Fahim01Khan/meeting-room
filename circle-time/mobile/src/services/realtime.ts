// Real-time update service for Panel App

import type { RoomState } from '../types/meeting';

type RoomStateCallback = (state: RoomState) => void;

let pollingInterval: NodeJS.Timeout | null = null;
let subscribers: RoomStateCallback[] = [];

export const subscribeToRoomUpdates = (
  roomId: string,
  callback: RoomStateCallback
): (() => void) => {
  // TODO: wire data source - implement WebSocket or polling
  console.log(`Subscribing to room updates: ${roomId}`);
  
  subscribers.push(callback);
  
  // Return unsubscribe function
  return () => {
    subscribers = subscribers.filter((cb) => cb !== callback);
  };
};

export const startPolling = (roomId: string, intervalMs: number = 30000): void => {
  // TODO: wire data source
  console.log(`Starting polling for room ${roomId} every ${intervalMs}ms`);
  
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  pollingInterval = setInterval(() => {
    // Fetch room state and notify subscribers
    console.log('Polling for updates...');
  }, intervalMs);
};

export const stopPolling = (): void => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
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
  // TODO: implement connection status check
  return true;
};

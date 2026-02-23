'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { RoomState, ScreenType, Meeting, RoomInfo } from '../types/meeting';
import { fetchRoomState, checkInMeeting, endMeetingEarly, bookAdHoc } from '../services/api';
import { subscribeToRoomUpdates, startPolling, stopPolling } from '../services/realtime';
import { cacheRoomState, getCachedRoomState } from '../services/cache';

interface RoomStateContextValue {
  roomState: RoomState | null;
  currentScreen: ScreenType;
  isLoading: boolean;
  error: string | null;
  setCurrentScreen: (screen: ScreenType) => void;
  refreshRoomState: () => Promise<void>;
  handleCheckIn: () => Promise<boolean>;
  handleEndEarly: () => Promise<boolean>;
  handleAdHocBooking: (durationMinutes: number) => Promise<boolean>;
}

const RoomStateContext = createContext<RoomStateContextValue | null>(null);

// Configuration - would come from device setup in production
const ROOM_ID = '00000000-0000-0000-0000-000000000001';

interface RoomStateProviderProps {
  children: ReactNode;
}

export const RoomStateProvider: React.FC<RoomStateProviderProps> = ({ children }) => {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref used by the auto-switch effect to read currentScreen without adding it
  // to the dependency array (which would cause an infinite update loop).
  const currentScreenRef = useRef<ScreenType>('idle');
  currentScreenRef.current = currentScreen;

  const refreshRoomState = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch fresh data
      const state = await fetchRoomState(ROOM_ID);

      if (state) {
        setRoomState(state);
        await cacheRoomState(ROOM_ID, state);
      } else {
        // Fall back to cached data
        const cached = await getCachedRoomState(ROOM_ID);
        if (cached) {
          setRoomState(cached);
        }
      }
    } catch (err) {
      setError('Failed to fetch room state');
      console.error(err);

      // Try cached data on error
      const cached = await getCachedRoomState(ROOM_ID);
      if (cached) {
        setRoomState(cached);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCheckIn = useCallback(async (): Promise<boolean> => {
    if (!roomState?.currentMeeting) return false;

    setIsLoading(true);
    try {
      const result = await checkInMeeting(roomState.currentMeeting.id);

      if (result.success) {
        // Update local state
        setRoomState((prev) => {
          if (!prev || !prev.currentMeeting) return prev;
          return {
            ...prev,
            currentMeeting: {
              ...prev.currentMeeting,
              checkedIn: true,
              checkedInAt: new Date().toISOString(),
            },
          };
        });
        setCurrentScreen('meeting');
        return true;
      }

      setError(result.message || 'Check-in failed');
      return false;
    } catch (err) {
      setError('Failed to check in');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [roomState]);

  const handleEndEarly = useCallback(async (): Promise<boolean> => {
    if (!roomState?.currentMeeting) return false;

    setIsLoading(true);
    try {
      const result = await endMeetingEarly(roomState.currentMeeting.id);

      if (result.success) {
        // Update local state
        setRoomState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'available',
            currentMeeting: null,
          };
        });
        setCurrentScreen('idle');
        return true;
      }

      setError(result.message || 'Failed to end meeting');
      return false;
    } catch (err) {
      setError('Failed to end meeting');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [roomState]);

  const handleAdHocBooking = useCallback(async (durationMinutes: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await bookAdHoc(ROOM_ID, durationMinutes);

      if (result.success && result.data) {
        // Set room state optimistically so auto-switch sees 'occupied' + currentMeeting
        setRoomState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'occupied',
            currentMeeting: {
              ...result.data!,
              checkedIn: false,
            },
          };
        });
        setCurrentScreen('checkin');
        return true;
      }

      setError(result.message || 'Booking failed');
      return false;
    } catch (err) {
      setError('Failed to create booking');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToRoomUpdates(ROOM_ID, (state) => {
      setRoomState(state);
      cacheRoomState(ROOM_ID, state);
    });

    startPolling(ROOM_ID);

    return () => {
      unsubscribe();
      stopPolling();
    };
  }, []);

  // Initial load
  useEffect(() => {
    refreshRoomState();
  }, [refreshRoomState]);

  // Auto-switch screens based on room state.
  // When the room is available we do NOT override adHocBooking — the user is
  // actively booking and the room won't show as occupied until after check-in.
  useEffect(() => {
    if (!roomState) return;

    if (roomState.status === 'occupied' && roomState.currentMeeting) {
      if (!roomState.currentMeeting.checkedIn) {
        setCurrentScreen('checkin');
      } else {
        setCurrentScreen('meeting');
      }
    } else if (currentScreenRef.current !== 'adHocBooking') {
      setCurrentScreen('idle');
    }
  }, [roomState]);

  const value: RoomStateContextValue = {
    roomState,
    currentScreen,
    isLoading,
    error,
    setCurrentScreen,
    refreshRoomState,
    handleCheckIn,
    handleEndEarly,
    handleAdHocBooking,
  };

  return (
    <RoomStateContext.Provider value={value}>
      {children}
    </RoomStateContext.Provider>
  );
};

export const useRoomState = (): RoomStateContextValue => {
  const context = useContext(RoomStateContext);
  if (!context) {
    throw new Error('useRoomState must be used within a RoomStateProvider');
  }
  return context;
};

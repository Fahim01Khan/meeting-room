'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RoomState, ScreenType } from '../types/meeting';
import { fetchRoomState, checkInMeeting, endMeetingEarly, bookAdHoc } from '../services/api';
import { subscribeToRoomUpdates, startPolling, stopPolling } from '../services/realtime';
import { cacheRoomState, getCachedRoomState } from '../services/cache';

const ROOM_ID_STORAGE_KEY = '@circle_time:room_id';

interface RoomStateContextValue {
  roomState: RoomState | null;
  currentScreen: ScreenType;
  isLoading: boolean;
  error: string | null;
  roomId: string | null;
  setCurrentScreen: (screen: ScreenType) => void;
  refreshRoomState: () => Promise<void>;
  handleCheckIn: () => Promise<boolean>;
  handleEndEarly: () => Promise<boolean>;
  handleAdHocBooking: (durationMinutes: number) => Promise<boolean>;
  handlePaired: (newRoomId: string) => Promise<void>;
  clearPairing: () => Promise<void>;
}

const RoomStateContext = createContext<RoomStateContextValue | null>(null);

interface RoomStateProviderProps {
  children: ReactNode;
}

export const RoomStateProvider: React.FC<RoomStateProviderProps> = ({ children }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('pairing');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref used by the auto-switch effect to read currentScreen without adding it
  // to the dependency array (which would cause an infinite update loop).
  const currentScreenRef = useRef<ScreenType>('pairing');
  currentScreenRef.current = currentScreen;

  // ── On mount: load saved roomId from AsyncStorage ──────────────────────
  useEffect(() => {
    AsyncStorage.getItem(ROOM_ID_STORAGE_KEY)
      .then((savedId) => {
        if (savedId) {
          setRoomId(savedId);
          setCurrentScreen('idle');
        } else {
          // No paired room yet — show pairing screen
          setCurrentScreen('pairing');
        }
      })
      .catch(() => {
        setCurrentScreen('pairing');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // ── Called by PairingScreen when admin pairs the device ────────────────
  const handlePaired = useCallback(async (newRoomId: string) => {
    await AsyncStorage.setItem(ROOM_ID_STORAGE_KEY, newRoomId);
    setRoomId(newRoomId);
    setCurrentScreen('idle');
  }, []);

  // ── Clear the pairing (reset to pairing screen) ───────────────────────
  const clearPairing = useCallback(async () => {
    await AsyncStorage.removeItem(ROOM_ID_STORAGE_KEY);
    stopPolling();
    setRoomId(null);
    setRoomState(null);
    setCurrentScreen('pairing');
  }, []);

  const refreshRoomState = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);

    try {
      const state = await fetchRoomState(roomId);

      if (state) {
        setRoomState(state);
        await cacheRoomState(roomId, state);
      } else {
        const cached = await getCachedRoomState(roomId);
        if (cached) {
          setRoomState(cached);
        }
      }
    } catch (err) {
      setError('Failed to fetch room state');
      console.error(err);

      const cached = await getCachedRoomState(roomId);
      if (cached) {
        setRoomState(cached);
      }
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const handleCheckIn = useCallback(async (): Promise<boolean> => {
    if (!roomState?.currentMeeting) return false;

    setIsLoading(true);
    try {
      const result = await checkInMeeting(roomState.currentMeeting.id);

      if (result.success) {
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
    if (!roomId) return false;
    setIsLoading(true);
    setError(null);
    try {
      const result = await bookAdHoc(roomId, durationMinutes);

      if (result.success && result.data) {
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
  }, [roomId]);

  // ── Subscribe to real-time updates when roomId is available ───────────
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToRoomUpdates(roomId, (state) => {
      setRoomState(state);
      cacheRoomState(roomId, state);
    });

    startPolling(roomId);

    return () => {
      unsubscribe();
      stopPolling();
    };
  }, [roomId]);

  // ── Initial room state load when roomId is set ────────────────────────
  useEffect(() => {
    if (roomId) {
      refreshRoomState();
    }
  }, [roomId, refreshRoomState]);

  // ── Auto-switch screens based on room state ───────────────────────────
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
    roomId,
    setCurrentScreen,
    refreshRoomState,
    handleCheckIn,
    handleEndEarly,
    handleAdHocBooking,
    handlePaired,
    clearPairing,
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

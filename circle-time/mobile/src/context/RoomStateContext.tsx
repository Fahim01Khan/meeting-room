'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RoomState, ScreenType } from '../types/meeting';
import { fetchRoomState, checkInMeeting, endMeetingEarly, bookAdHoc, fetchOrgSettings } from '../services/api';
import { subscribeToRoomUpdates, startPolling, stopPolling } from '../services/realtime';
import { cacheRoomState, getCachedRoomState } from '../services/cache';

const ROOM_ID_STORAGE_KEY = '@circle_time:room_id';
const DEVICE_SERIAL_STORAGE_KEY = '@circle_time:device_serial';

interface RoomStateContextValue {
  roomState: RoomState | null;
  currentScreen: ScreenType;
  isLoading: boolean;
  error: string | null;
  roomId: string | null;
  deviceSerial: string | null;
  orgName: string;
  primaryColour: string;
  logoUrl: string | null;
  checkinWindowMinutes: number;
  setCurrentScreen: (screen: ScreenType) => void;
  refreshRoomState: () => Promise<void>;
  handleCheckIn: () => Promise<boolean>;
  handleEndEarly: () => Promise<boolean>;
  handleAdHocBooking: (durationMinutes: number) => Promise<boolean>;
  handlePaired: (newRoomId: string, deviceSerial: string) => Promise<void>;
  clearPairing: () => Promise<void>;
}

const RoomStateContext = createContext<RoomStateContextValue | null>(null);

interface RoomStateProviderProps {
  children: ReactNode;
}

export const RoomStateProvider: React.FC<RoomStateProviderProps> = ({ children }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [deviceSerial, setDeviceSerial] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('pairing');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [primaryColour, setPrimaryColour] = useState('#2563EB');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [checkinWindowMinutes, setCheckinWindowMinutes] = useState(15);

  // Ref used by the auto-switch effect to read currentScreen without adding it
  // to the dependency array (which would cause an infinite update loop).
  const currentScreenRef = useRef<ScreenType>('pairing');
  currentScreenRef.current = currentScreen;

  // Track fresh pairing flow so the mount useEffect doesn't stomp
  // 'calendar-select' back to 'idle' when it reads the just-saved roomId.
  const isOnboarding = useRef(false);

  // ── On mount: load saved roomId from AsyncStorage + fetch org settings ─
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ROOM_ID_STORAGE_KEY),
      AsyncStorage.getItem(DEVICE_SERIAL_STORAGE_KEY),
    ])
      .then(([savedId, savedSerial]) => {
        if (savedId) {
          setRoomId(savedId);
          setDeviceSerial(savedSerial);
          if (!isOnboarding.current) {
            setCurrentScreen('idle');
          }
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

    fetchOrgSettings().then((settings) => {
      if (settings) {
        setOrgName(settings.orgName);
        setPrimaryColour(settings.primaryColour);
        setLogoUrl(settings.logoUrl);
        if (settings.checkinWindowMinutes) {
          setCheckinWindowMinutes(settings.checkinWindowMinutes);
        }
      }
    });
  }, []);

  // ── Called by PairingScreen when admin pairs the device ────────────────
  const handlePaired = useCallback(async (newRoomId: string, serial: string) => {
    isOnboarding.current = true;
    await AsyncStorage.setItem(ROOM_ID_STORAGE_KEY, newRoomId);
    await AsyncStorage.setItem(DEVICE_SERIAL_STORAGE_KEY, serial);
    setRoomId(newRoomId);
    setDeviceSerial(serial);
    setCurrentScreen('calendar-select');
  }, []);

  // ── Clear the pairing (reset to pairing screen) ───────────────────────
  const clearPairing = useCallback(async () => {
    await AsyncStorage.multiRemove([ROOM_ID_STORAGE_KEY, DEVICE_SERIAL_STORAGE_KEY]);
    stopPolling();
    setRoomId(null);
    setDeviceSerial(null);
    setRoomState(null);
    setCurrentScreen('pairing');
  }, []);

  const refreshRoomState = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);

    try {
      const state = await fetchRoomState(roomId, deviceSerial);

      if (state) {
        // Check for unpaired signal
        if ((state as unknown as { unpaired?: boolean }).unpaired) {
          await AsyncStorage.multiRemove([ROOM_ID_STORAGE_KEY, DEVICE_SERIAL_STORAGE_KEY]);
          stopPolling();
          setRoomId(null);
          setDeviceSerial(null);
          setRoomState(null);
          setCurrentScreen('pairing');
          return;
        }
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
  }, [roomId, deviceSerial]);

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

    startPolling(roomId, 30000, deviceSerial);

    return () => {
      unsubscribe();
      stopPolling();
    };
  }, [roomId, deviceSerial]);

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
    } else if (
      currentScreenRef.current !== 'adHocBooking' &&
      currentScreenRef.current !== 'calendar-select'
    ) {
      setCurrentScreen('idle');
    }
  }, [roomState]);

  const value: RoomStateContextValue = {
    roomState,
    currentScreen,
    isLoading,
    error,
    roomId,
    deviceSerial,
    orgName,
    primaryColour,
    logoUrl,
    checkinWindowMinutes,
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

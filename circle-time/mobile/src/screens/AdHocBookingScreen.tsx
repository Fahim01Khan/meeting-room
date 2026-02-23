'use client';

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

const DURATION_OPTIONS: { label: string; minutes: number }[] = [
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '90 min', minutes: 90 },
  { label: '2 hours', minutes: 120 },
];

export const AdHocBookingScreen: React.FC = () => {
  const { roomState, isLoading, handleAdHocBooking, setCurrentScreen } = useRoomState();
  const [activeDuration, setActiveDuration] = useState<number | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const onSelectDuration = async (minutes: number) => {
    setActiveDuration(minutes);
    setBookingError(null);

    const success = await handleAdHocBooking(minutes);

    if (!success) {
      setBookingError('This room is currently unavailable. Please try a shorter duration.');
      setActiveDuration(null);
    }
    // On success, context navigates to 'checkin' — no action needed here
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Book This Room</Text>
        {roomState?.room.name ? (
          <Text style={styles.subtitle}>{roomState.room.name}</Text>
        ) : null}
      </View>

      {/* Room meta */}
      {roomState?.room && (
        <View style={styles.roomMeta}>
          <Text style={styles.roomMetaText}>
            {roomState.room.building} · Floor {roomState.room.floor} · Capacity {roomState.room.capacity}
          </Text>
        </View>
      )}

      {/* Prompt */}
      <Text style={styles.promptText}>How long do you need the room?</Text>

      {/* Duration buttons — 2×2 grid */}
      <View style={styles.durationGrid}>
        {DURATION_OPTIONS.map(({ label, minutes }) => {
          const isActive = activeDuration === minutes;
          return (
            <View key={minutes} style={styles.durationButtonWrapper}>
              <PrimaryButton
                title={label}
                onPress={() => onSelectDuration(minutes)}
                variant={isActive ? 'primary' : 'outline'}
                size="medium"
                fullWidth
                loading={isActive && isLoading}
              />
            </View>
          );
        })}
      </View>

      {/* Error message */}
      {bookingError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{bookingError}</Text>
        </View>
      )}

      {/* Cancel */}
      <View style={styles.cancelContainer}>
        <PrimaryButton
          title="Cancel"
          onPress={() => setCurrentScreen('idle')}
          variant="outline"
          size="medium"
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  roomMeta: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  roomMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  promptText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  durationButtonWrapper: {
    width: '48%',
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  cancelContainer: {
    marginTop: spacing.xs,
  },
});

export default AdHocBookingScreen;

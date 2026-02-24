'use client';

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

const DURATION_OPTIONS: { label: string; minutes: number }[] = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
];

/**
 * Fishbowl-style ad-hoc booking overlay.
 * Translucent dark backdrop with a centred card showing duration options.
 */
export const AdHocBookingScreen: React.FC = () => {
  const { roomState, isLoading, handleAdHocBooking, setCurrentScreen } = useRoomState();
  const [activeDuration, setActiveDuration] = useState<number | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const onSelect = async (minutes: number) => {
    setActiveDuration(minutes);
    setBookingError(null);
    const ok = await handleAdHocBooking(minutes);
    if (!ok) {
      setBookingError('Room unavailable — try a shorter duration.');
      setActiveDuration(null);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Book This Room</Text>
        {roomState?.room && (
          <Text style={styles.subtitle}>
            {roomState.room.name} · Capacity {roomState.room.capacity}
          </Text>
        )}

        <Text style={styles.prompt}>Select duration</Text>

        <View style={styles.grid}>
          {DURATION_OPTIONS.map(({ label, minutes }) => {
            const active = activeDuration === minutes;
            return (
              <TouchableOpacity
                key={minutes}
                style={[styles.durationBtn, active && styles.durationBtnActive]}
                onPress={() => onSelect(minutes)}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={[styles.durationText, active && styles.durationTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {bookingError && <Text style={styles.errorText}>{bookingError}</Text>}

        <PrimaryButton
          title="Cancel"
          onPress={() => setCurrentScreen('idle')}
          variant="outline"
          size="medium"
          fullWidth
          disabled={isLoading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 560,
    ...shadows.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  prompt: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  durationBtn: {
    width: '48%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBtnActive: {
    borderColor: colors.statusAvailable,
    backgroundColor: colors.statusAvailable,
  },
  durationText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  durationTextActive: {
    color: colors.onStatus,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});

export default AdHocBookingScreen;

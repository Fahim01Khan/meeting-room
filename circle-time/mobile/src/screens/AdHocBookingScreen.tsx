'use client';

import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
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
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

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

  // ─── Landscape ──────────────────────────────────────────────────────────────
  if (isLandscape) {
    return (
      <View style={styles.container}>
        <View style={styles.landscapeBody}>

          {/* Left — hero prompt */}
          <View style={styles.leftCol}>
            <View>
              <Text style={styles.heroStatus}>book now</Text>
              {roomState?.room.name ? (
                <Text style={styles.roomSubtitle}>{roomState.room.name}</Text>
              ) : null}
            </View>

            {roomState?.room && (
              <Text style={styles.roomMeta}>
                {roomState.room.building} · Floor {roomState.room.floor} · Capacity {roomState.room.capacity}
              </Text>
            )}

            <PrimaryButton
              title="Cancel"
              onPress={() => setCurrentScreen('idle')}
              variant="primary"
              size="medium"
              style={styles.cancelBtn}
            />
          </View>

          {/* Right — duration grid */}
          <View style={styles.rightCol}>
            <Text style={styles.promptText}>How long do you need the room?</Text>

            <View style={styles.durationGrid}>
              {DURATION_OPTIONS.map(({ label, minutes }) => {
                const isActive = activeDuration === minutes;
                return (
                  <View key={minutes} style={styles.durationCell}>
                    <PrimaryButton
                      title={label}
                      onPress={() => onSelectDuration(minutes)}
                      variant={isActive ? 'primary' : 'outline'}
                      size="large"
                      fullWidth
                      loading={isActive && isLoading}
                    />
                  </View>
                );
              })}
            </View>

            {bookingError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{bookingError}</Text>
              </View>
            )}
          </View>

        </View>
      </View>
    );
  }

  // ─── Portrait ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, styles.portraitWrap]}>
      {/* Header */}
      <View style={styles.portraitHeader}>
        <Text style={styles.title}>Book This Room</Text>
        {roomState?.room.name ? (
          <Text style={styles.subtitle}>{roomState.room.name}</Text>
        ) : null}
      </View>

      {/* Room meta */}
      {roomState?.room && (
        <View style={styles.portraitMeta}>
          <Text style={styles.roomMeta}>
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
            <View key={minutes} style={styles.durationCell}>
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
          variant="primary"
          size="medium"
          fullWidth
        />
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  /* ── Core ─────────────────────────────────────────────────────────────── */
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },

  /* ── Landscape ────────────────────────────────────────────────────────── */
  landscapeBody: { flex: 1, flexDirection: 'row' },

  leftCol: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: spacing.xl,
  },
  heroStatus: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.light,
    color: colors.primary,
  },
  roomSubtitle: {
    fontSize: typography.fontSize.xl,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
  },
  roomMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xxl,
  },

  rightCol: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: spacing.xl,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  promptText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  durationCell: {
    width: '48%',
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },

  /* ── Portrait ─────────────────────────────────────────────────────────── */
  portraitWrap: { justifyContent: 'center' },
  portraitHeader: {
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
  portraitMeta: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cancelContainer: {
    marginTop: spacing.md,
  },
});

export default AdHocBookingScreen;

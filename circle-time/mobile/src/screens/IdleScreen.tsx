'use client';

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { HeaderBar } from '../components/HeaderBar';
import { FooterBar } from '../components/FooterBar';
import { TimelineSidebar } from '../components/TimelineSidebar';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

/**
 * Fishbowl-style idle screen.
 *
 * Full-bleed GREEN background when available.
 * Left panel: large "Available" + time-until-next + Book Now button.
 * Right panel: upcoming meetings timeline.
 */
export const IdleScreen: React.FC = () => {
  const { roomState, setCurrentScreen } = useRoomState();

  if (!roomState) {
    return (
      <View style={[styles.container, { backgroundColor: colors.statusAvailable }]}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const getAvailableFor = (): string | null => {
    if (!roomState.nextMeeting) return null;
    const now = new Date();
    const start = new Date(roomState.nextMeeting.startTime);
    const diffMins = Math.floor((start.getTime() - now.getTime()) / 60000);
    if (diffMins <= 0) return null;
    if (diffMins < 60) return `Available for ${diffMins} min`;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return m > 0 ? `Available for ${h}h ${m}m` : `Available for ${h}h`;
  };

  const availableFor = getAvailableFor();
  const upcoming = roomState.upcomingMeetings ?? [];
  // Include nextMeeting at the head of the timeline if not already present
  const timelineMeetings =
    roomState.nextMeeting &&
    !upcoming.some((m) => m.id === roomState.nextMeeting!.id)
      ? [roomState.nextMeeting, ...upcoming]
      : upcoming;

  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <HeaderBar />

      {/* ── Body ────────────────────────────────────────────────────── */}
      <View style={styles.body}>
        {/* Left panel — status + action */}
        <View style={styles.left}>
          <View style={styles.statusRow}>
            <View style={styles.dot} />
            <Text style={styles.statusLabel}>Available</Text>
          </View>

          {availableFor && (
            <Text style={styles.availableFor}>{availableFor}</Text>
          )}
          {!roomState.nextMeeting && (
            <Text style={styles.availableFor}>No more meetings today</Text>
          )}

          {roomState.status === 'available' && (
            <View style={styles.bookRow}>
              <PrimaryButton
                title="Book Now"
                onPress={() => setCurrentScreen('adHocBooking')}
                variant="primary"
                size="large"
                style={styles.bookButton}
              />
            </View>
          )}
        </View>

        {/* Right panel — timeline */}
        <View style={styles.right}>
          <TimelineSidebar meetings={timelineMeetings} />
        </View>
      </View>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <FooterBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.statusAvailable,
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: typography.fontSize.xl,
    color: colors.onStatusMuted,
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  left: {
    flex: 3,
    justifyContent: 'center',
    paddingLeft: spacing.lg,
  },
  right: {
    flex: 2,
  },

  // ── Status ────────────────────────────────────────────────────────────────
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.onStatus,
    marginRight: spacing.sm,
    opacity: 0.9,
  },
  statusLabel: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.onStatus,
  },
  availableFor: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.medium,
    color: colors.onStatusMuted,
    marginBottom: spacing.lg,
  },

  // ── Book button ───────────────────────────────────────────────────────────
  bookRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  bookButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: colors.onStatus,
    borderRadius: borderRadius.lg,
    minWidth: 200,
  },
});

export default IdleScreen;

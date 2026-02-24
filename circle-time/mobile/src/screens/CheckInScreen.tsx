'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { HeaderBar } from '../components/HeaderBar';
import { FooterBar } from '../components/FooterBar';
import { TimelineSidebar } from '../components/TimelineSidebar';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

/**
 * Fishbowl-style check-in screen.
 *
 * Full-bleed AMBER background. Countdown + meeting info on the left,
 * timeline on the right. Prominent "Check In" + "Release Room" actions.
 */
export const CheckInScreen: React.FC = () => {
  const { roomState, handleCheckIn, handleEndEarly, isLoading } = useRoomState();
  const [countdown, setCountdown] = useState(15 * 60);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const fmtCountdown = () => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const onCheckIn = async () => {
    setCheckInError(null);
    const ok = await handleCheckIn();
    if (!ok) setCheckInError('Check-in failed. Please try again.');
  };

  const onRelease = async () => {
    setIsEnding(true);
    await handleEndEarly();
    setIsEnding(false);
  };

  if (!roomState?.currentMeeting) {
    return (
      <View style={[styles.container, { backgroundColor: colors.statusCheckin }]}>
        <Text style={styles.noMeeting}>No meeting to check in</Text>
      </View>
    );
  }

  const meeting = roomState.currentMeeting;
  const isUrgent = countdown < 5 * 60;
  const bg = isUrgent ? colors.statusOccupied : colors.statusCheckin;
  const upcoming = roomState.upcomingMeetings ?? [];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <HeaderBar />

      <View style={styles.body}>
        {/* ── Left: check-in prompt ─────────────────────────────────── */}
        <View style={styles.left}>
          <Text style={styles.promptLabel}>CHECK IN REQUIRED</Text>

          {/* Countdown */}
          <Text style={styles.countdownValue}>{fmtCountdown()}</Text>
          <Text style={styles.countdownHint}>time remaining to check in</Text>

          {isUrgent && (
            <Text style={styles.urgentWarning}>
              Room will be released if not checked in
            </Text>
          )}

          {/* Progress bar (time left) */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(countdown / (15 * 60)) * 100}%`,
                  backgroundColor: isUrgent
                    ? 'rgba(255,255,255,0.90)'
                    : 'rgba(255,255,255,0.60)',
                },
              ]}
            />
          </View>

          {/* Meeting info card */}
          <View style={styles.meetingCard}>
            <Text style={styles.meetingTitle} numberOfLines={1}>
              {meeting.title}
            </Text>
            <Text style={styles.meetingMeta}>
              {meeting.organizer} · {fmtTime(meeting.startTime)} – {fmtTime(meeting.endTime)}
            </Text>
          </View>

          {/* Error */}
          {checkInError && (
            <Text style={styles.errorText}>{checkInError}</Text>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <PrimaryButton
              title="Check In Now"
              onPress={onCheckIn}
              variant="primary"
              size="large"
              style={styles.checkInBtn}
              loading={isLoading && !isEnding}
              disabled={isEnding}
            />
            <PrimaryButton
              title="Release Room"
              onPress={onRelease}
              variant="outline"
              size="large"
              style={styles.releaseBtn}
              loading={isEnding}
              disabled={isLoading && !isEnding}
            />
          </View>

          <Text style={styles.helpText}>
            Meeting organizer or any attendee can check in
          </Text>
        </View>

        {/* ── Right: timeline ───────────────────────────────────────── */}
        <View style={styles.right}>
          <TimelineSidebar meetings={upcoming} />
        </View>
      </View>

      <FooterBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noMeeting: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: typography.fontSize.xl,
    color: colors.onStatusMuted,
  },

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

  // ── Prompt ──────────────────────────────────────────────────────────────────
  promptLabel: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onStatus,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  countdownValue: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.onStatus,
    marginBottom: spacing.xs,
  },
  countdownHint: {
    fontSize: typography.fontSize.lg,
    color: colors.onStatusMuted,
    marginBottom: spacing.sm,
  },
  urgentWarning: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.onStatus,
    marginBottom: spacing.sm,
  },

  // ── Progress ────────────────────────────────────────────────────────────────
  progressTrack: {
    width: '85%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // ── Meeting card ────────────────────────────────────────────────────────────
  meetingCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  meetingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.onStatus,
    marginBottom: 4,
  },
  meetingMeta: {
    fontSize: typography.fontSize.base,
    color: colors.onStatusMuted,
  },

  // ── Error ───────────────────────────────────────────────────────────────────
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.onStatus,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // ── Actions ─────────────────────────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkInBtn: {
    backgroundColor: colors.onStatus,
    flex: 1,
  },
  releaseBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.onStatus,
    flex: 1,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.onStatusMuted,
  },
});

export default CheckInScreen;

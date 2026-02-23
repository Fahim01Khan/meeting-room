'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { StatusIndicator } from '../components/StatusIndicator';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

export const CheckInScreen: React.FC = () => {
  const { roomState, handleCheckIn, handleEndEarly, isLoading } = useRoomState();
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes in seconds
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const onReleaseRoom = async () => {
    setIsEnding(true);
    await handleEndEarly();
    setIsEnding(false);
  };

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  const formatCountdown = (): string => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const onCheckIn = async () => {
    setCheckInError(null);
    const success = await handleCheckIn();
    if (!success) {
      setCheckInError('Check-in failed. Please try again.');
    }
  };

  if (!roomState?.currentMeeting) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>No meeting to check in</Text>
      </View>
    );
  }

  const meeting = roomState.currentMeeting;
  const isUrgent = countdown < 5 * 60; // Less than 5 minutes
  const bgColor = isUrgent ? colors.warningLight : colors.background;
  const accentColor = isUrgent ? colors.warning : colors.primary;

  // ─── Landscape two-column layout ────────────────────────────────────────────
  if (isLandscape) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Compact header */}
        <View style={styles.headerCompact}>
          <StatusIndicator status="upcoming" size="small" />
          <Text style={styles.roomName}>{roomState.room.name}</Text>
        </View>

        {/* Left column: icon + prompt + countdown | Right column: meeting + actions */}
        <View style={styles.landscapeBody}>
          <View style={styles.landscapeLeft}>
            <View style={[styles.iconCircleLandscape, { backgroundColor: accentColor }]}>
              <Text style={styles.iconTextLandscape}>✓</Text>
            </View>
            <Text style={styles.promptTitle}>Check In Required</Text>
            <Text style={styles.promptSubtitle}>
              Confirm your presence to keep this booking
            </Text>
            <Text style={[styles.countdownValueLandscape, { color: isUrgent ? colors.error : colors.text }]}>
              {formatCountdown()}
            </Text>
            <Text style={styles.countdownLabel}>time remaining</Text>
            {isUrgent && (
              <Text style={styles.countdownWarning}>
                Room will be released if not checked in
              </Text>
            )}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(countdown / (15 * 60)) * 100}%`,
                    backgroundColor: isUrgent ? colors.error : colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.landscapeRight}>
            <View style={styles.meetingCard}>
              <Text style={styles.meetingTitle}>{meeting.title}</Text>
              <Text style={styles.meetingOrganizer}>{meeting.organizer}</Text>
              <Text style={styles.meetingTime}>
                {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
              </Text>
              {meeting.attendeeCount > 0 && (
                <View style={styles.attendeesBadge}>
                  <Text style={styles.attendeesText}>
                    {meeting.attendeeCount}{' '}
                    {meeting.attendeeCount === 1 ? 'attendee' : 'attendees'}
                  </Text>
                </View>
              )}
            </View>

            {checkInError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{checkInError}</Text>
              </View>
            )}

            <View style={styles.actionsLandscape}>
              <PrimaryButton
                title="Check In Now"
                onPress={onCheckIn}
                variant="primary"
                size="large"
                fullWidth
                loading={isLoading && !isEnding}
                disabled={isEnding}
              />
              <View style={styles.actionSpacer} />
              <PrimaryButton
                title="Release Room"
                onPress={onReleaseRoom}
                variant="outline"
                size="large"
                fullWidth
                loading={isEnding}
                disabled={isLoading && !isEnding}
              />
            </View>

            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                Meeting organizer or any attendee can check in
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ─── Portrait layout ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <StatusIndicator status="upcoming" size="large" />
        <Text style={styles.roomName}>{roomState.room.name}</Text>
      </View>

      {/* Check-in Prompt */}
      <View style={styles.promptContainer}>
        <View style={[styles.iconCircle, { backgroundColor: accentColor }]}>
          <Text style={styles.iconText}>✓</Text>
        </View>
        <Text style={styles.promptTitle}>Check In Required</Text>
        <Text style={styles.promptSubtitle}>
          Please confirm your presence to keep this booking
        </Text>
      </View>

      {/* Meeting Info */}
      <View style={styles.meetingCard}>
        <Text style={styles.meetingTitle}>{meeting.title}</Text>
        <Text style={styles.meetingOrganizer}>{meeting.organizer}</Text>
        <Text style={styles.meetingTime}>
          {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
        </Text>
        {meeting.attendeeCount > 0 && (
          <View style={styles.attendeesBadge}>
            <Text style={styles.attendeesText}>
              {meeting.attendeeCount} {meeting.attendeeCount === 1 ? 'attendee' : 'attendees'}
            </Text>
          </View>
        )}
      </View>

      {/* Countdown */}
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownLabel}>Time to check in</Text>
        <Text style={[styles.countdownValue, { color: isUrgent ? colors.error : colors.text }]}>
          {formatCountdown()}
        </Text>
        {isUrgent && (
          <Text style={styles.countdownWarning}>
            Room will be released if not checked in
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${(countdown / (15 * 60)) * 100}%`,
              backgroundColor: isUrgent ? colors.error : colors.primary,
            },
          ]}
        />
      </View>

      {/* Error Message */}
      {checkInError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{checkInError}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <PrimaryButton
          title="Check In Now"
          onPress={onCheckIn}
          variant="primary"
          size="large"
          fullWidth
          loading={isLoading && !isEnding}
          disabled={isEnding}
        />
        <View style={styles.actionSpacer} />
        <PrimaryButton
          title="Release Room"
          onPress={onReleaseRoom}
          variant="outline"
          size="large"
          fullWidth
          loading={isEnding}
          disabled={isLoading && !isEnding}
        />
      </View>

      {/* Help Text */}
      <View style={styles.helpContainer}>
        <Text style={styles.helpText}>
          Meeting organizer or any attendee can check in
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ── Core ──────────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Headers ───────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  // Reduced-height header used in landscape
  headerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  roomName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  // ── Portrait prompt ───────────────────────────────────────────────────────────
  promptContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconText: {
    fontSize: 44,
    color: colors.background,
  },
  // Smaller icon/text used in the landscape left column
  iconCircleLandscape: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconTextLandscape: {
    fontSize: 40,
    color: colors.background,
  },
  promptTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  promptSubtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // ── Meeting card ──────────────────────────────────────────────────────────────
  meetingCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    alignItems: 'center',
  },
  meetingTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  meetingOrganizer: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  meetingTime: {
    fontSize: typography.fontSize.lg,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  attendeesBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  attendeesText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },

  // ── Countdown ─────────────────────────────────────────────────────────────────
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  countdownLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  // Full-size countdown for portrait
  countdownValue: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
  },
  // Compact countdown for landscape column
  countdownValueLandscape: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  countdownWarning: {
    fontSize: typography.fontSize.base,
    color: colors.error,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // ── Progress bar ──────────────────────────────────────────────────────────────
  progressBar: {
    height: 8,
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // ── Error ─────────────────────────────────────────────────────────────────────
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },

  // ── Actions ───────────────────────────────────────────────────────────────────
  actions: {
    paddingVertical: spacing.md,
  },
  // Tighter vertical padding keeps both buttons visible in landscape
  actionsLandscape: {
    paddingVertical: spacing.sm,
  },
  actionSpacer: {
    height: spacing.sm,
  },
  helpContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // ── Landscape-specific layout ─────────────────────────────────────────────────
  landscapeBody: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xl,
  },
  landscapeLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeRight: {
    flex: 1,
    justifyContent: 'space-between',
  },
});

export default CheckInScreen;

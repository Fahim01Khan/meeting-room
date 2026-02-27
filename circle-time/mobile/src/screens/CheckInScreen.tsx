'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

export const CheckInScreen: React.FC = () => {
  const { roomState, handleCheckIn, handleEndEarly, isLoading, checkinWindowMinutes } = useRoomState();
  const [countdown, setCountdown] = useState(checkinWindowMinutes * 60);
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
  const accentColor = isUrgent ? colors.warning : colors.primary;
  const leftPanelColor = '#FEF3C7';

  // ─── Landscape (Fishbowl-style) ────────────────────────────────────────────
  if (isLandscape) {
    return (
      <View style={styles.container}>
        <View style={styles.landscapeBody}>

          {/* Left — hero prompt + countdown */}
          <View style={[styles.leftCol, { backgroundColor: leftPanelColor }]}>
            <View>
              <Text style={[styles.heroStatus, { color: accentColor }]}>check in</Text>
              <Text style={styles.promptSubtitle}>
                Confirm your presence to keep this booking
              </Text>
            </View>

            <View style={styles.countdownBlock}>
              <Text style={[styles.countdownValue, { color: isUrgent ? colors.error : colors.text }]}>
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
                      width: `${(countdown / (checkinWindowMinutes * 60)) * 100}%`,
                      backgroundColor: isUrgent ? colors.error : colors.primary,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.leftActions}>
              <PrimaryButton
                title="Check In Now"
                onPress={onCheckIn}
                variant="primary"
                size="large"
                style={styles.actionBtnWide}
                loading={isLoading && !isEnding}
                disabled={isEnding}
              />
            </View>
          </View>

          {/* Right — meeting details + release */}
          <View style={[styles.rightCol, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.rightTop}>
              <Text style={styles.roomName}>{roomState.room.name}</Text>
            </View>

            <View style={styles.meetingCard}>
              <Text style={styles.meetingTitle}>{meeting.title}</Text>
              <Text style={styles.meetingOrganizer}>{meeting.organizer || 'Kiosk User'}</Text>
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

            <View style={styles.rightBottom}>
              <PrimaryButton
                title="Release Room"
                onPress={onReleaseRoom}
                variant="outline"
                size="large"
                style={styles.actionBtnWide}
                loading={isEnding}
                disabled={isLoading && !isEnding}
              />
              <View style={styles.helpRow}>
                <Text style={styles.helpText}>
                  Meeting organizer or any attendee can check in
                </Text>
              </View>
            </View>
          </View>

        </View>
      </View>
    );
  }

  // ─── Portrait layout ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, styles.portraitWrap, { backgroundColor: leftPanelColor }]}>
      {/* Room name */}
      <Text style={styles.roomNamePortrait}>{roomState.room.name}</Text>

      {/* Hero prompt + countdown */}
      <View style={styles.portraitCenter}>
        <Text style={[styles.heroStatusPortrait, { color: accentColor }]}>check in</Text>
        <Text style={styles.promptSubtitlePortrait}>
          Please confirm your presence to keep this booking
        </Text>

        <Text style={[styles.countdownValuePortrait, { color: isUrgent ? colors.error : colors.text }]}>
          {formatCountdown()}
        </Text>
        <Text style={styles.countdownLabel}>Time to check in</Text>
        {isUrgent && (
          <Text style={styles.countdownWarning}>
            Room will be released if not checked in
          </Text>
        )}
        <View style={[styles.progressBar, { marginTop: spacing.md }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(countdown / (checkinWindowMinutes * 60)) * 100}%`,
                backgroundColor: isUrgent ? colors.error : colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Meeting Info */}
      <View style={styles.meetingCard}>
        <Text style={styles.meetingTitle}>{meeting.title}</Text>
        <Text style={styles.meetingOrganizer}>{meeting.organizer || 'Kiosk User'}</Text>
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

      {/* Error Message */}
      {checkInError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{checkInError}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.portraitActions}>
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
      <View style={styles.helpRow}>
        <Text style={styles.helpText}>
          Meeting organizer or any attendee can check in
        </Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  /* ── Core ─────────────────────────────────────────────────────────────── */
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  /* ── Landscape ────────────────────────────────────────────────────────── */
  landscapeBody: { flex: 1, flexDirection: 'row' },

  leftCol: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  heroStatus: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.light,
  },
  promptSubtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  countdownBlock: {
    gap: spacing.xs,
  },
  countdownValue: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
  },
  countdownLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  countdownWarning: {
    fontSize: typography.fontSize.base,
    color: colors.error,
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 6,
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  leftActions: {
    alignItems: 'flex-start',
  },
  actionBtnWide: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xxl,
  },

  rightCol: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  rightTop: { alignItems: 'flex-end' },
  roomName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'right',
  },

  meetingCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  meetingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  meetingOrganizer: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  meetingTime: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
  },
  attendeesBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  attendeesText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },

  rightBottom: {
    gap: spacing.sm,
  },
  helpRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },

  /* ── Portrait ─────────────────────────────────────────────────────────── */
  portraitWrap: { justifyContent: 'space-between', padding: spacing.xl },
  roomNamePortrait: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  portraitCenter: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  heroStatusPortrait: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.light,
  },
  promptSubtitlePortrait: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  countdownValuePortrait: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
  },
  portraitActions: {
    marginBottom: spacing.md,
  },
  actionSpacer: {
    height: spacing.sm,
  },
});

export default CheckInScreen;

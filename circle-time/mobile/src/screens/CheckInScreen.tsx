'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { StatusIndicator } from '../components/StatusIndicator';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

export const CheckInScreen: React.FC = () => {
  const { roomState, handleCheckIn, isLoading } = useRoomState();
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes in seconds
  const [checkInError, setCheckInError] = useState<string | null>(null);

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

  return (
    <View style={[styles.container, { backgroundColor: isUrgent ? colors.warningLight : colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <StatusIndicator status="upcoming" size="large" />
        <Text style={styles.roomName}>{roomState.room.name}</Text>
      </View>

      {/* Check-in Prompt */}
      <View style={styles.promptContainer}>
        <View style={[styles.iconCircle, { backgroundColor: isUrgent ? colors.warning : colors.primary }]}>
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
        <Text style={styles.meetingOrganizer}>
          {meeting.organizer}
        </Text>
        <Text style={styles.meetingTime}>
          {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
        </Text>
        <View style={styles.attendeesBadge}>
          <Text style={styles.attendeesText}>
            {meeting.attendeeCount} {meeting.attendeeCount === 1 ? 'attendee' : 'attendees'}
          </Text>
        </View>
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
          loading={isLoading}
        />
        <View style={styles.actionSpacer} />
        <PrimaryButton
          title="Release Room"
          onPress={() => {
            // TODO: Implement release room
            console.log('Release room pressed');
          }}
          variant="outline"
          size="large"
          fullWidth
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
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  roomName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  promptContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconText: {
    fontSize: 64,
    color: colors.background,
  },
  promptTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  promptSubtitle: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  meetingCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginVertical: spacing.lg,
    alignItems: 'center',
  },
  meetingTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.md,
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
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  countdownLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  countdownValue: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
  },
  countdownWarning: {
    fontSize: typography.fontSize.base,
    color: colors.error,
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  actions: {
    paddingVertical: spacing.xl,
  },
  actionSpacer: {
    height: spacing.md,
  },
  helpContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
});

export default CheckInScreen;

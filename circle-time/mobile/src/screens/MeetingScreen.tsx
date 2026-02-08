'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { StatusIndicator } from '../components/StatusIndicator';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

export const MeetingScreen: React.FC = () => {
  const { roomState, setCurrentScreen } = useRoomState();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate time remaining
  useEffect(() => {
    if (!roomState?.currentMeeting) return;

    const endTime = new Date(roomState.currentMeeting.endTime);
    const now = new Date();
    const diffMs = endTime.getTime() - now.getTime();

    if (diffMs <= 0) {
      setTimeRemaining('Ended');
      return;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m remaining`);
    } else if (minutes > 0) {
      setTimeRemaining(`${minutes}m ${seconds}s remaining`);
    } else {
      setTimeRemaining(`${seconds}s remaining`);
    }
  }, [currentTime, roomState?.currentMeeting]);

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getProgress = (): number => {
    if (!roomState?.currentMeeting) return 0;

    const start = new Date(roomState.currentMeeting.startTime).getTime();
    const end = new Date(roomState.currentMeeting.endTime).getTime();
    const now = Date.now();

    const progress = (now - start) / (end - start);
    return Math.min(Math.max(progress, 0), 1);
  };

  if (!roomState?.currentMeeting) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>No active meeting</Text>
      </View>
    );
  }

  const meeting = roomState.currentMeeting;
  const progress = getProgress();
  const isEnding = progress > 0.9;

  return (
    <View style={[styles.container, { backgroundColor: isEnding ? colors.warningLight : colors.errorLight }]}>
      {/* Header */}
      <View style={styles.header}>
        <StatusIndicator status="occupied" size="large" />
        <Text style={styles.roomName}>{roomState.room.name}</Text>
      </View>

      {/* Meeting Info */}
      <View style={styles.meetingInfo}>
        <Text style={styles.meetingTitle}>{meeting.title}</Text>
        <Text style={styles.meetingOrganizer}>
          Organized by {meeting.organizer}
        </Text>
        <View style={styles.timeRow}>
          <Text style={styles.meetingTime}>
            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: isEnding ? colors.warning : colors.error,
              },
            ]}
          />
        </View>
        <Text style={[styles.timeRemaining, { color: isEnding ? colors.warning : colors.error }]}>
          {timeRemaining}
        </Text>
      </View>

      {/* Attendees */}
      <View style={styles.attendeesCard}>
        <Text style={styles.attendeesLabel}>ATTENDEES</Text>
        <View style={styles.attendeesRow}>
          <View style={styles.attendeesIcon}>
            <Text style={styles.attendeesIconText}>{meeting.attendeeCount}</Text>
          </View>
          <Text style={styles.attendeesText}>
            {meeting.attendeeCount} {meeting.attendeeCount === 1 ? 'person' : 'people'} expected
          </Text>
        </View>
      </View>

      {/* Check-in Status */}
      {meeting.checkedIn && (
        <View style={styles.checkedInBadge}>
          <Text style={styles.checkedInText}>✓ Checked In</Text>
          {meeting.checkedInAt && (
            <Text style={styles.checkedInTime}>
              at {formatTime(meeting.checkedInAt)}
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <PrimaryButton
          title="End Meeting Early"
          onPress={() => setCurrentScreen('endEarly')}
          variant="outline"
          size="large"
          fullWidth
        />
      </View>

      {/* Next Meeting Warning */}
      {roomState.nextMeeting && (
        <View style={styles.nextMeetingWarning}>
          <Text style={styles.nextMeetingText}>
            Next: {roomState.nextMeeting.title} at{' '}
            {formatTime(roomState.nextMeeting.startTime)}
          </Text>
        </View>
      )}
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
  meetingInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  meetingTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  meetingOrganizer: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  timeRow: {
    marginTop: spacing.sm,
  },
  meetingTime: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  progressContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  timeRemaining: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  attendeesCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.md,
    ...shadows.sm,
  },
  attendeesLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  attendeesIconText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  attendeesText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.md,
  },
  checkedInText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  checkedInTime: {
    fontSize: typography.fontSize.base,
    color: colors.success,
    marginLeft: spacing.sm,
  },
  actions: {
    paddingVertical: spacing.xl,
  },
  nextMeetingWarning: {
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  nextMeetingText: {
    fontSize: typography.fontSize.base,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
  },
});

export default MeetingScreen;

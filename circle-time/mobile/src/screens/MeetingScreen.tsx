'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { StatusIndicator } from '../components/StatusIndicator';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

export const MeetingScreen: React.FC = () => {
  const { roomState, setCurrentScreen } = useRoomState();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

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

  // ─── Landscape two-column layout ────────────────────────────────────────────
  if (isLandscape) {
    return (
      <View style={[styles.container, { backgroundColor: isEnding ? colors.warningLight : colors.errorLight }]}>
        {/* Full-width header */}
        <View style={styles.header}>
          <StatusIndicator status="occupied" size="large" />
          <Text style={styles.roomName}>{roomState.room.name}</Text>
        </View>

        {/* Two-column body */}
        <View style={styles.landscapeBody}>
          {/* Left column: meeting info + progress */}
          <View style={styles.landscapeLeft}>
            <Text style={styles.meetingTitleLandscape}>{meeting.title}</Text>
            <Text style={styles.meetingOrganizerLandscape}>
              Organized by {meeting.organizer}
            </Text>
            <Text style={styles.meetingTimeLandscape}>
              {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
            </Text>

            <View style={styles.progressContainerLandscape}>
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
              <Text style={[styles.timeRemainingLandscape, { color: isEnding ? colors.warning : colors.error }]}>
                {timeRemaining}
              </Text>
            </View>
          </View>

          {/* Right column: attendees + badges + action */}
          <View style={styles.landscapeRight}>
            <View>
              <View style={styles.attendeesCardLandscape}>
                <Text style={styles.attendeesLabel}>
                  {meeting.attendeeCount > 0 ? 'ATTENDEES' : 'BOOKING TYPE'}
                </Text>
                <View style={styles.attendeesRow}>
                  <View style={styles.attendeesIcon}>
                    <Text style={styles.attendeesIconText}>
                      {meeting.attendeeCount > 0 ? meeting.attendeeCount : '⚡'}
                    </Text>
                  </View>
                  <Text style={styles.attendeesText}>
                    {meeting.attendeeCount > 0
                      ? `${meeting.attendeeCount} ${meeting.attendeeCount === 1 ? 'person' : 'people'} expected`
                      : 'Walk-in booking'}
                  </Text>
                </View>
              </View>

              {/* Check-in Status */}
              {meeting.checkedIn && (
                <View style={styles.checkedInBadgeLandscape}>
                  <Text style={styles.checkedInText}>✓ Checked In</Text>
                  {meeting.checkedInAt && (
                    <Text style={styles.checkedInTime}>
                      at {formatTime(meeting.checkedInAt)}
                    </Text>
                  )}
                </View>
              )}

              {/* Next Meeting Warning */}
              {roomState.nextMeeting && (
                <View style={styles.nextMeetingWarningLandscape}>
                  <Text style={styles.nextMeetingText}>
                    Next: {roomState.nextMeeting.title} at{' '}
                    {formatTime(roomState.nextMeeting.startTime)}
                  </Text>
                </View>
              )}
            </View>

            {/* Action pinned at bottom of right column */}
            <View style={styles.actionsLandscape}>
              <PrimaryButton
                title="End Meeting Early"
                onPress={() => setCurrentScreen('endEarly')}
                variant="outline"
                size="large"
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ─── Portrait fallback ───────────────────────────────────────────────────────
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
        <Text style={styles.attendeesLabel}>
          {meeting.attendeeCount > 0 ? 'ATTENDEES' : 'BOOKING TYPE'}
        </Text>
        <View style={styles.attendeesRow}>
          <View style={styles.attendeesIcon}>
            <Text style={styles.attendeesIconText}>
              {meeting.attendeeCount > 0 ? meeting.attendeeCount : '⚡'}
            </Text>
          </View>
          <Text style={styles.attendeesText}>
            {meeting.attendeeCount > 0
              ? `${meeting.attendeeCount} ${meeting.attendeeCount === 1 ? 'person' : 'people'} expected`
              : 'Walk-in booking'}
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
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  roomName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  // ── Landscape layout ──────────────────────────────────────────────────────────
  landscapeBody: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xl,
  },
  landscapeLeft: {
    flex: 45,
    justifyContent: 'center',
  },
  landscapeRight: {
    flex: 55,
    justifyContent: 'space-between',
  },
  meetingTitleLandscape: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  meetingOrganizerLandscape: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  meetingTimeLandscape: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.md,
  },
  progressContainerLandscape: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  timeRemainingLandscape: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  attendeesCardLandscape: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  checkedInBadgeLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  nextMeetingWarningLandscape: {
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  actionsLandscape: {
    paddingTop: spacing.sm,
  },

  // ── Portrait layout ───────────────────────────────────────────────────────────
  meetingInfo: {
    alignItems: 'center',
    paddingVertical: spacing.md,
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
    paddingVertical: spacing.sm,
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
    marginTop: spacing.sm,
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
    paddingVertical: spacing.md,
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

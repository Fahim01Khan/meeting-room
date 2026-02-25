'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
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
  const statusColor = isEnding ? colors.warning : colors.error;

  // ─── Landscape (Fishbowl-style) ────────────────────────────────────────────
  if (isLandscape) {
    return (
      <View style={styles.container}>
        <View style={styles.landscapeBody}>

          {/* Left — giant status + countdown */}
          <View style={styles.leftCol}>
            <View>
              <Text style={[styles.clock, { color: statusColor }]}>
                {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
              </Text>
            </View>

            <View>
              <Text style={[styles.heroStatus, { color: statusColor }]}>occupied</Text>
              <Text style={[styles.countdown, { color: statusColor }]}>{timeRemaining}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress * 100}%`, backgroundColor: statusColor },
                  ]}
                />
              </View>
            </View>

            <PrimaryButton
              title="End Meeting Early"
              onPress={() => setCurrentScreen('endEarly')}
              variant="primary"
              size="large"
              style={styles.actionBtn}
            />
          </View>

          {/* Right — meeting details */}
          <View style={styles.rightCol}>
            <View style={styles.rightTop}>
              <Text style={styles.roomName}>{roomState.room.name}</Text>
            </View>

            <View style={styles.meetingDetails}>
              <Text style={styles.meetingTitle}>{meeting.title}</Text>
              <Text style={styles.meetingOrganizer}>
                Organized by {meeting.organizer || 'Kiosk User'}
              </Text>

              {/* Attendees */}
              <View style={styles.metaRow}>
                <View style={styles.metaIcon}>
                  <Text style={styles.metaIconText}>
                    {meeting.attendeeCount > 0 ? meeting.attendeeCount : '⚡'}
                  </Text>
                </View>
                <Text style={styles.metaText}>
                  {meeting.attendeeCount > 0
                    ? `${meeting.attendeeCount} ${meeting.attendeeCount === 1 ? 'person' : 'people'} expected`
                    : 'Walk-in booking'}
                </Text>
              </View>

              {/* Check-in Status */}
              {meeting.checkedIn && (
                <View style={styles.checkedInRow}>
                  <Text style={styles.checkedInText}>✓ Checked In</Text>
                  {meeting.checkedInAt && (
                    <Text style={styles.checkedInTime}>
                      at {formatTime(meeting.checkedInAt)}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Next Meeting Warning */}
            {roomState.nextMeeting && (
              <View style={styles.nextWarning}>
                <Text style={styles.nextWarningText}>
                  Next: {roomState.nextMeeting.title} at{' '}
                  {formatTime(roomState.nextMeeting.startTime)}
                </Text>
              </View>
            )}
          </View>

        </View>
      </View>
    );
  }

  // ─── Portrait fallback ───────────────────────────────────────────────────────
  return (
    <View style={[styles.container, styles.portraitWrap]}>
      {/* Room name */}
      <Text style={styles.roomNamePortrait}>{roomState.room.name}</Text>

      {/* Hero status + countdown */}
      <View style={styles.portraitCenter}>
        <Text style={[styles.heroStatusPortrait, { color: statusColor }]}>occupied</Text>
        <Text style={[styles.countdownPortrait, { color: statusColor }]}>{timeRemaining}</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: statusColor },
            ]}
          />
        </View>
      </View>

      {/* Meeting Info */}
      <View style={styles.meetingDetailsPortrait}>
        <Text style={styles.meetingTitle}>{meeting.title}</Text>
        <Text style={styles.meetingOrganizer}>
          Organized by {meeting.organizer || 'Kiosk User'}
        </Text>
        <Text style={styles.meetingTimePortrait}>
          {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
        </Text>

        {/* Attendees */}
        <View style={styles.metaRow}>
          <View style={styles.metaIcon}>
            <Text style={styles.metaIconText}>
              {meeting.attendeeCount > 0 ? meeting.attendeeCount : '⚡'}
            </Text>
          </View>
          <Text style={styles.metaText}>
            {meeting.attendeeCount > 0
              ? `${meeting.attendeeCount} ${meeting.attendeeCount === 1 ? 'person' : 'people'} expected`
              : 'Walk-in booking'}
          </Text>
        </View>

        {/* Check-in Status */}
        {meeting.checkedIn && (
          <View style={styles.checkedInRow}>
            <Text style={styles.checkedInText}>✓ Checked In</Text>
            {meeting.checkedInAt && (
              <Text style={styles.checkedInTime}>
                at {formatTime(meeting.checkedInAt)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.portraitActions}>
        <PrimaryButton
          title="End Meeting Early"
          onPress={() => setCurrentScreen('endEarly')}
          variant="primary"
          size="large"
          fullWidth
        />
      </View>

      {/* Next Meeting Warning */}
      {roomState.nextMeeting && (
        <View style={styles.nextWarning}>
          <Text style={styles.nextWarningText}>
            Next: {roomState.nextMeeting.title} at{' '}
            {formatTime(roomState.nextMeeting.startTime)}
          </Text>
        </View>
      )}
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
    paddingRight: spacing.xl,
  },
  clock: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.light,
  },
  heroStatus: {
    fontSize: 118,
    fontWeight: typography.fontWeight.light,
  },
  countdown: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.light,
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 6,
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xxl,
  },

  rightCol: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: spacing.xl,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
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

  meetingDetails: {
    gap: spacing.sm,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  metaIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  metaIconText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  metaText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  checkedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  checkedInText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  checkedInTime: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginLeft: spacing.sm,
  },

  nextWarning: {
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  nextWarningText: {
    fontSize: typography.fontSize.base,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },

  /* ── Portrait ─────────────────────────────────────────────────────────── */
  portraitWrap: { justifyContent: 'space-between' },
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
  countdownPortrait: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.light,
    marginTop: spacing.xs,
  },
  meetingDetailsPortrait: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  meetingTimePortrait: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  portraitActions: {
    marginBottom: spacing.md,
  },
});

export default MeetingScreen;

'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { StatusIndicator } from '../components/StatusIndicator';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

export const IdleScreen: React.FC = () => {
  const { roomState, setCurrentScreen } = useRoomState();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatMeetingTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimeUntilNextMeeting = (): string | null => {
    if (!roomState?.nextMeeting) return null;

    const now = new Date();
    const start = new Date(roomState.nextMeeting.startTime);
    const diffMs = start.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `in ${diffMins} minutes`;
    }

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `in ${hours}h ${mins}m`;
  };

  if (!roomState) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const timeUntilNext = getTimeUntilNextMeeting();
  const bgColor = roomState.status === 'available' ? colors.successLight : colors.background;

  // Shared next meeting card rendered in both layouts
  const nextMeetingCard = roomState.nextMeeting ? (
    <View style={styles.nextMeetingCard}>
      <Text style={styles.nextMeetingLabel}>NEXT MEETING</Text>
      <Text style={styles.nextMeetingTitle}>{roomState.nextMeeting.title}</Text>
      <Text style={styles.nextMeetingTime}>
        {formatMeetingTime(roomState.nextMeeting.startTime)} –{' '}
        {formatMeetingTime(roomState.nextMeeting.endTime)}
      </Text>
      <Text style={styles.nextMeetingOrganizer}>
        {roomState.nextMeeting.organizer}
      </Text>
      {timeUntilNext && (
        <View style={styles.timeUntilBadge}>
          <Text style={styles.timeUntilText}>Starts {timeUntilNext}</Text>
        </View>
      )}
    </View>
  ) : null;

  // ─── Landscape two-column layout ────────────────────────────────────────────
  if (isLandscape) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.landscapeBody}>

          {/* Left column: clock + room identity */}
          <View style={styles.landscapeLeft}>
            <Text style={styles.timeLandscape}>{formatTime(currentTime)}</Text>
            <Text style={styles.dateLandscape}>{formatDate(currentTime)}</Text>
            <View style={styles.landscapeDivider} />
            <Text style={styles.roomNameLandscape}>{roomState.room.name}</Text>
            <Text style={styles.roomLocationLandscape}>
              {roomState.room.building} · Floor {roomState.room.floor}
            </Text>
            <View style={styles.statusContainerLandscape}>
              <StatusIndicator status={roomState.status} size="large" />
            </View>
            <View style={styles.capacityBadgeLandscape}>
              <Text style={styles.capacityText}>
                Capacity: {roomState.room.capacity} people
              </Text>
            </View>
          </View>

          {/* Right column: next meeting (top) + action + footer (bottom) */}
          <View style={styles.landscapeRight}>
            {/* top slot — empty view keeps space-between working when no meeting */}
            {nextMeetingCard ?? <View />}

            <View style={styles.landscapeBottom}>
              {roomState.status === 'available' && (
                <PrimaryButton
                  title="Book Now"
                  onPress={() => setCurrentScreen('adHocBooking')}
                  variant="primary"
                  size="large"
                  fullWidth
                />
              )}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Tap to interact · Auto-refreshes every 30 seconds
                </Text>
              </View>
            </View>
          </View>

        </View>
      </View>
    );
  }

  // ─── Portrait fallback ───────────────────────────────────────────────────────
  return (
    <View style={[styles.container, styles.portraitContainer, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <Text style={styles.date}>{formatDate(currentTime)}</Text>
      </View>

      {/* Room Info */}
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{roomState.room.name}</Text>
        <Text style={styles.roomLocation}>
          {roomState.room.building} · Floor {roomState.room.floor}
        </Text>
        <View style={styles.statusContainer}>
          <StatusIndicator status={roomState.status} size="large" />
        </View>
      </View>

      {/* Capacity */}
      <View style={styles.capacityBadge}>
        <Text style={styles.capacityText}>
          Capacity: {roomState.room.capacity} people
        </Text>
      </View>

      {/* Next Meeting */}
      {nextMeetingCard}

      {/* Quick Book Button (if available) */}
      {roomState.status === 'available' && (
        <View style={styles.actionContainer}>
          <PrimaryButton
            title="Book Now"
            onPress={() => setCurrentScreen('adHocBooking')}
            variant="primary"
            size="large"
            fullWidth
          />
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tap to interact · Auto-refreshes every 30 seconds
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
  portraitContainer: {
    justifyContent: 'space-between',
  },
  loadingText: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Landscape layout ──────────────────────────────────────────────────────────
  landscapeBody: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xl,
  },
  landscapeLeft: {
    flex: 2,
    justifyContent: 'center',
  },
  landscapeRight: {
    flex: 3,
    justifyContent: 'space-between',
  },
  landscapeBottom: {
    gap: spacing.md,
  },
  timeLandscape: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  dateLandscape: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  landscapeDivider: {
    height: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  roomNameLandscape: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  roomLocationLandscape: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusContainerLandscape: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  capacityBadgeLandscape: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },

  // ── Portrait header ───────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  time: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  date: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // ── Portrait room info ────────────────────────────────────────────────────────
  roomInfo: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  roomName: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  roomLocation: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  statusContainer: {
    marginTop: spacing.lg,
  },

  // ── Shared: capacity badge ────────────────────────────────────────────────────
  capacityBadge: {
    alignSelf: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  capacityText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },

  // ── Shared: next meeting card ─────────────────────────────────────────────────
  nextMeetingCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  nextMeetingLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  nextMeetingTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  nextMeetingTime: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  nextMeetingOrganizer: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
  },
  timeUntilBadge: {
    marginTop: spacing.md,
    backgroundColor: colors.warningLight,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  timeUntilText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.warning,
  },

  // ── Portrait action ───────────────────────────────────────────────────────────
  actionContainer: {
    paddingVertical: spacing.xs,
  },

  // ── Shared: footer ────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
});

export default IdleScreen;

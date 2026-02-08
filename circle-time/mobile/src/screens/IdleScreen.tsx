'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { StatusIndicator } from '../components/StatusIndicator';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

export const IdleScreen: React.FC = () => {
  const { roomState, setCurrentScreen } = useRoomState();
  const [currentTime, setCurrentTime] = useState(new Date());

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

  return (
    <View style={[styles.container, { backgroundColor: roomState.status === 'available' ? colors.successLight : colors.background }]}>
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
      {roomState.nextMeeting && (
        <View style={styles.nextMeetingCard}>
          <Text style={styles.nextMeetingLabel}>NEXT MEETING</Text>
          <Text style={styles.nextMeetingTitle}>{roomState.nextMeeting.title}</Text>
          <Text style={styles.nextMeetingTime}>
            {formatMeetingTime(roomState.nextMeeting.startTime)} -{' '}
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
      )}

      {/* Quick Book Button (if available) */}
      {roomState.status === 'available' && (
        <View style={styles.actionContainer}>
          <PrimaryButton
            title="Book Now"
            onPress={() => {
              // TODO: Implement quick booking
              console.log('Quick book pressed');
            }}
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
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  loadingText: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
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
  roomInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
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
  capacityBadge: {
    alignSelf: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  capacityText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  nextMeetingCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginVertical: spacing.lg,
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
  actionContainer: {
    paddingVertical: spacing.lg,
  },
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

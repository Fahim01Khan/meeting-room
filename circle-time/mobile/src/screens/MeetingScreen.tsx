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
 * Fishbowl-style occupied / in-meeting screen.
 *
 * Full-bleed RED background (or amber when meeting is nearly over).
 * Left panel: meeting title, organiser, time, progress bar, countdown, actions.
 * Right panel: upcoming meetings timeline.
 */
export const MeetingScreen: React.FC = () => {
  const { roomState, setCurrentScreen } = useRoomState();
  const [, setTick] = useState(0);

  // Re-render every second for the countdown
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  if (!roomState?.currentMeeting) {
    return (
      <View style={[styles.container, { backgroundColor: colors.statusOccupied }]}>
        <Text style={styles.noMeeting}>No active meeting</Text>
      </View>
    );
  }

  const meeting = roomState.currentMeeting;
  const start = new Date(meeting.startTime).getTime();
  const end = new Date(meeting.endTime).getTime();
  const now = Date.now();
  const progress = Math.min(Math.max((now - start) / (end - start), 0), 1);
  const isEnding = progress > 0.85;
  const remainMs = Math.max(end - now, 0);
  const remainMin = Math.floor(remainMs / 60000);
  const remainSec = Math.floor((remainMs % 60000) / 1000);
  const countdown =
    remainMin > 0
      ? `${remainMin}m ${remainSec}s remaining`
      : remainMs > 0
        ? `${remainSec}s remaining`
        : 'Ended';

  const bg = isEnding ? colors.statusCheckin : colors.statusOccupied;

  const upcoming = roomState.upcomingMeetings ?? [];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <HeaderBar />

      <View style={styles.body}>
        {/* ── Left: meeting details ─────────────────────────────────── */}
        <View style={styles.left}>
          <Text style={styles.statusLabel}>Occupied</Text>

          <Text style={styles.meetingTitle} numberOfLines={2}>
            {meeting.title}
          </Text>
          <Text style={styles.organizer}>
            {meeting.organizer}
          </Text>
          <Text style={styles.timeRange}>
            {fmtTime(meeting.startTime)} – {fmtTime(meeting.endTime)}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: isEnding
                    ? 'rgba(255,255,255,0.90)'
                    : 'rgba(255,255,255,0.60)',
                },
              ]}
            />
          </View>
          <Text style={styles.countdown}>{countdown}</Text>

          {/* Check-in badge */}
          {meeting.checkedIn && (
            <View style={styles.checkedInBadge}>
              <Text style={styles.checkedInText}>✓ Checked In</Text>
            </View>
          )}

          {/* End early */}
          <View style={styles.actionRow}>
            <PrimaryButton
              title="End Meeting Early"
              onPress={() => setCurrentScreen('endEarly')}
              variant="outline"
              size="large"
              style={styles.actionButton}
            />
          </View>
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

  // ── Body ────────────────────────────────────────────────────────────────────
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

  // ── Status ──────────────────────────────────────────────────────────────────
  statusLabel: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onStatusMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  meetingTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onStatus,
    marginBottom: spacing.xs,
  },
  organizer: {
    fontSize: typography.fontSize.xl,
    color: colors.onStatusMuted,
    marginBottom: spacing.xs,
  },
  timeRange: {
    fontSize: typography.fontSize.lg,
    color: colors.onStatusMuted,
    marginBottom: spacing.md,
  },

  // ── Progress ────────────────────────────────────────────────────────────────
  progressTrack: {
    height: 10,
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  countdown: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onStatus,
    marginBottom: spacing.md,
  },

  // ── Badges ──────────────────────────────────────────────────────────────────
  checkedInBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  checkedInText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.onStatus,
  },

  // ── Actions ─────────────────────────────────────────────────────────────────
  actionRow: {
    marginTop: spacing.sm,
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.onStatus,
    minWidth: 240,
  },
});

export default MeetingScreen;

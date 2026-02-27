'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

export const IdleScreen: React.FC = () => {
  const { roomState, setCurrentScreen, orgName, primaryColour, logoUrl } = useRoomState();
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
  const accent = primaryColour || colors.primary;
  const leftPanelColor = '#DBEAFE';

  // ─── Next‑meeting row (shared) ──────────────────────────────────────────
  const nextMeetingRow = roomState.nextMeeting ? (
    <View style={styles.nextMeetingRow}>
      <View style={[styles.nextMeetingDot, { backgroundColor: colors.warning }]} />
      <View style={styles.nextMeetingContent}>
        <Text style={styles.nextMeetingTitle} numberOfLines={1}>
          {roomState.nextMeeting.title}
        </Text>
        <Text style={styles.nextMeetingTime}>
          {formatMeetingTime(roomState.nextMeeting.startTime)} –{' '}
          {formatMeetingTime(roomState.nextMeeting.endTime)}
          {timeUntilNext ? `  ·  Starts ${timeUntilNext}` : ''}
        </Text>
        <Text style={styles.nextMeetingOrganizer}>
          {roomState.nextMeeting.organizer}
        </Text>
      </View>
    </View>
  ) : (
    <Text style={styles.noUpcoming}>No upcoming events</Text>
  );

  // ─── Landscape (Fishbowl-style) ────────────────────────────────────────────
  if (isLandscape) {
    return (
      <View style={styles.container}>
        <View style={styles.landscapeBody}>

          {/* Left column — clock, giant status word, book button */}
          <View style={[styles.leftCol, { backgroundColor: leftPanelColor }]}>
            <View>
              <Text style={[styles.clock, { color: accent }]}>{formatTime(currentTime)}</Text>
              <Text style={[styles.date, { color: accent }]}>{formatDate(currentTime)}</Text>
            </View>

            <Text style={[styles.heroStatus, { color: accent }]}>available</Text>

            {roomState.status === 'available' && (
              <PrimaryButton
                title="Book Now"
                onPress={() => setCurrentScreen('adHocBooking')}
                variant="primary"
                size="large"
                style={styles.bookBtn}
              />
            )}
          </View>

          {/* Right column — logo / room info / upcoming */}
          <View style={[styles.rightCol, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.rightTop}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
              ) : (
                <Text style={styles.orgName}>{orgName}</Text>
              )}
              <Text style={styles.roomName}>{roomState.room.name}</Text>
              <Text style={styles.roomLocation}>
                {roomState.room.building} · Floor {roomState.room.floor}
              </Text>
              <Text style={styles.capacityText}>
                Capacity: {roomState.room.capacity} people
              </Text>
            </View>

            <View style={styles.rightBottom}>
              <Text style={styles.sectionLabel}>NEXT MEETING</Text>
              {nextMeetingRow}
            </View>
          </View>

        </View>
      </View>
    );
  }

  // ─── Portrait fallback ───────────────────────────────────────────────────────
  return (
    <View style={[styles.container, styles.portraitWrap, { backgroundColor: leftPanelColor }]}>
      {/* Branding */}
      <View style={styles.portraitHeader}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logoPortrait} resizeMode="contain" />
        ) : (
          <Text style={styles.orgName}>{orgName}</Text>
        )}
        <Text style={styles.roomNamePortrait}>{roomState.room.name}</Text>
      </View>

      {/* Clock + hero status */}
      <View style={styles.portraitCenter}>
        <Text style={[styles.clock, { color: accent }]}>{formatTime(currentTime)}</Text>
        <Text style={[styles.date, { color: accent }]}>{formatDate(currentTime)}</Text>
        <Text style={[styles.heroStatusPortrait, { color: accent }]}>available</Text>
      </View>

      {/* Room meta */}
      <View style={styles.portraitMeta}>
        <Text style={styles.roomLocation}>
          {roomState.room.building} · Floor {roomState.room.floor}
        </Text>
        <Text style={styles.capacityText}>
          Capacity: {roomState.room.capacity} people
        </Text>
      </View>

      {/* Upcoming */}
      <View style={styles.portraitUpcoming}>
        <Text style={styles.sectionLabel}>NEXT MEETING</Text>
        {nextMeetingRow}
      </View>

      {/* Book Now */}
      {roomState.status === 'available' && (
        <View style={styles.portraitAction}>
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
  clock: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.light,
  },
  date: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.light,
    marginTop: 4,
  },
  heroStatus: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.light,
  },
  bookBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xxl,
  },

  rightCol: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: spacing.xl,
  },
  rightTop: { alignItems: 'flex-end' },
  logo: { height: 56, width: 180, marginBottom: spacing.md },
  orgName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  roomName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  roomLocation: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  capacityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  rightBottom: { alignSelf: 'stretch' },

  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  nextMeetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  nextMeetingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 8,
    marginRight: spacing.sm,
  },
  nextMeetingContent: { flex: 1 },
  nextMeetingTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  nextMeetingTime: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  nextMeetingOrganizer: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  noUpcoming: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  /* ── Portrait ─────────────────────────────────────────────────────────── */
  portraitWrap: { justifyContent: 'space-between', padding: spacing.xl },
  portraitHeader: { alignItems: 'center', marginBottom: spacing.lg },
  logoPortrait: { height: 48, width: 160, marginBottom: spacing.sm },
  roomNamePortrait: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  portraitCenter: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  heroStatusPortrait: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.light,
    marginTop: spacing.md,
  },
  portraitMeta: { alignItems: 'center', marginBottom: spacing.md },
  portraitUpcoming: { marginBottom: spacing.md },
  portraitAction: { marginBottom: spacing.md },

  footer: { alignItems: 'center', paddingVertical: spacing.sm },
  footerText: { fontSize: typography.fontSize.sm, color: colors.textMuted },
});

export default IdleScreen;

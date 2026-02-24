import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import type { Meeting } from '../types/meeting';

interface Props {
  meetings: Meeting[];
  /** Max items to render (default 6) */
  limit?: number;
}

const fmtTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

/**
 * Fishbowl-style translucent sidebar listing upcoming meetings.
 * Designed to sit on the right 35% of the screen.
 */
export const TimelineSidebar: React.FC<Props> = ({ meetings, limit = 6 }) => {
  const items = meetings.slice(0, limit);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>UPCOMING</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>No more meetings today</Text>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {items.map((m, idx) => (
            <View key={m.id} style={styles.item}>
              <Text style={styles.itemTime}>
                {fmtTime(m.startTime)} – {fmtTime(m.endTime)}
              </Text>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {m.title}
              </Text>
              <Text style={styles.itemOrganizer} numberOfLines={1}>
                {m.organizer}
              </Text>
              {idx < items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.timelineBg,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    overflow: 'hidden',
  },
  heading: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.onStatusMuted,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  empty: {
    fontSize: typography.fontSize.base,
    color: colors.onStatusMuted,
    fontStyle: 'italic',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.xs,
  },
  item: {
    backgroundColor: colors.timelineItem,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  itemTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.onStatus,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.onStatus,
    marginBottom: 2,
  },
  itemOrganizer: {
    fontSize: typography.fontSize.xs,
    color: colors.onStatusMuted,
  },
  divider: {
    display: 'none', // dividers within cards aren't needed; gap handles spacing
  },
});

export default TimelineSidebar;

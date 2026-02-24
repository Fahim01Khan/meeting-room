import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../styles/theme';
import { useRoomState } from '../context/RoomStateContext';

/**
 * Fishbowl-style slim translucent footer strip.
 * Shows: date (left) — capacity (centre) — building/floor (right).
 */
export const FooterBar: React.FC = () => {
  const { roomState } = useRoomState();

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.bar}>
      <Text style={styles.text}>{dateStr}</Text>
      {roomState?.room && (
        <Text style={styles.text}>
          Capacity {roomState.room.capacity} · {roomState.room.building} · Floor {roomState.room.floor}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.footerBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 4,
  },
  text: {
    fontSize: typography.fontSize.sm,
    color: colors.onStatusMuted,
  },
});

export default FooterBar;

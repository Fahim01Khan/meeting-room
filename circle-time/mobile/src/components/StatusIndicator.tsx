import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import type { RoomStatus } from '../types/meeting';

interface StatusIndicatorProps {
  status: RoomStatus;
  size?: 'small' | 'large';
}

const statusConfig: Record<RoomStatus, { label: string; color: string; bgColor: string }> = {
  available: {
    label: 'Available',
    color: colors.success,
    bgColor: colors.successLight,
  },
  occupied: {
    label: 'Occupied',
    color: colors.error,
    bgColor: colors.errorLight,
  },
  upcoming: {
    label: 'Upcoming',
    color: colors.warning,
    bgColor: colors.warningLight,
  },
  offline: {
    label: 'Offline',
    color: colors.textMuted,
    bgColor: colors.border,
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'large',
}) => {
  const config = statusConfig[status];
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bgColor },
        isLarge ? styles.containerLarge : styles.containerSmall,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: config.color },
          isLarge ? styles.dotLarge : styles.dotSmall,
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: config.color },
          isLarge ? styles.labelLarge : styles.labelSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  containerLarge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  containerSmall: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dot: {
    borderRadius: borderRadius.full,
  },
  dotLarge: {
    width: 16,
    height: 16,
    marginRight: spacing.sm,
  },
  dotSmall: {
    width: 10,
    height: 10,
    marginRight: spacing.xs,
  },
  label: {
    fontWeight: typography.fontWeight.semibold,
  },
  labelLarge: {
    fontSize: typography.fontSize.xl,
  },
  labelSmall: {
    fontSize: typography.fontSize.base,
  },
});

export default StatusIndicator;

import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../styles/theme';
import { useRoomState } from '../context/RoomStateContext';

/**
 * Fishbowl-style slim translucent header bar.
 * Shows: org logo / name — room name — live clock.
 */
export const HeaderBar: React.FC = () => {
  const { roomState, orgName, logoUrl } = useRoomState();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const clock = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <View style={styles.bar}>
      {/* Left: branding */}
      <View style={styles.left}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
        ) : orgName ? (
          <Text style={styles.orgName} numberOfLines={1}>{orgName}</Text>
        ) : null}
      </View>

      {/* Centre: room name */}
      <Text style={styles.roomName} numberOfLines={1}>
        {roomState?.room.name ?? ''}
      </Text>

      {/* Right: clock */}
      <Text style={styles.clock}>{clock}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.headerBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    height: 32,
    width: 120,
  },
  orgName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.onStatus,
  },
  roomName: {
    flex: 2,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onStatus,
    textAlign: 'center',
  },
  clock: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.onStatus,
    textAlign: 'right',
  },
});

export default HeaderBar;

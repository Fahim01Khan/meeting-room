'use client';

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

interface EndEarlyModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Fishbowl-style "End Meeting Early" confirmation overlay.
 * Translucent dark backdrop with centred card.
 */
export const EndEarlyModal: React.FC<EndEarlyModalProps> = ({ visible, onClose }) => {
  const { roomState, handleEndEarly, isLoading } = useRoomState();
  const [error, setError] = useState<string | null>(null);

  const timeSaved = (): number => {
    if (!roomState?.currentMeeting) return 0;
    const diff = new Date(roomState.currentMeeting.endTime).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 60000));
  };

  const onConfirm = async () => {
    setError(null);
    const ok = await handleEndEarly();
    if (ok) {
      onClose();
    } else {
      setError('Failed to end meeting. Please try again.');
    }
  };

  if (!visible) return null;
  const saved = timeSaved();

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>End Meeting Early?</Text>

        {roomState?.currentMeeting && (
          <View style={styles.meetingInfo}>
            <Text style={styles.meetingTitle} numberOfLines={1}>
              {roomState.currentMeeting.title}
            </Text>
            <Text style={styles.meetingOrg} numberOfLines={1}>
              {roomState.currentMeeting.organizer}
            </Text>
          </View>
        )}

        <View style={styles.savedRow}>
          <Text style={styles.savedLabel}>This will free up</Text>
          <Text style={styles.savedValue}>{saved} min</Text>
          <Text style={styles.savedSub}>Room becomes immediately available</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.actions}>
          <View style={styles.actionBtn}>
            <PrimaryButton
              title="End Meeting"
              onPress={onConfirm}
              variant="danger"
              size="medium"
              fullWidth
              loading={isLoading}
            />
          </View>
          <View style={styles.actionBtn}>
            <PrimaryButton
              title="Cancel"
              onPress={onClose}
              variant="outline"
              size="medium"
              fullWidth
              disabled={isLoading}
            />
          </View>
        </View>

        <Text style={styles.disclaimer}>
          The meeting organizer will be notified via email
        </Text>
      </View>
    </View>
  );
};

// Screen wrapper for context-based navigation
export const EndEarlyScreen: React.FC = () => {
  const { setCurrentScreen } = useRoomState();
  return <EndEarlyModal visible onClose={() => setCurrentScreen('meeting')} />;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 600,
    ...shadows.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  meetingInfo: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  meetingTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  meetingOrg: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  savedRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  savedLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  savedValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  savedSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionBtn: {
    flex: 1,
  },
  disclaimer: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default EndEarlyModal;

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

export const EndEarlyModal: React.FC<EndEarlyModalProps> = ({ visible, onClose }) => {
  const { roomState, handleEndEarly, isLoading } = useRoomState();
  const [error, setError] = useState<string | null>(null);

  const calculateTimeSaved = (): number => {
    if (!roomState?.currentMeeting) return 0;

    const now = new Date();
    const end = new Date(roomState.currentMeeting.endTime);
    const diffMs = end.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const onConfirm = async () => {
    setError(null);
    const success = await handleEndEarly();
    if (success) {
      onClose();
    } else {
      setError('Failed to end meeting. Please try again.');
    }
  };

  const timeSaved = calculateTimeSaved();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
          {/* Header row: icon + title */}
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⏹</Text>
            </View>
            <Text style={styles.title}>End Meeting Early?</Text>
          </View>

          {/* Meeting Info */}
          {roomState?.currentMeeting && (
            <View style={styles.meetingInfo}>
              <Text style={styles.meetingTitle} numberOfLines={1}>
                {roomState.currentMeeting.title}
              </Text>
              <Text style={styles.meetingOrganizer} numberOfLines={1}>
                {roomState.currentMeeting.organizer}
              </Text>
            </View>
          )}

          {/* Time Saved */}
          <View style={styles.timeSavedContainer}>
            <Text style={styles.timeSavedLabel}>This will free up</Text>
            <Text style={styles.timeSavedValue}>{timeSaved} min</Text>
            <Text style={styles.timeSavedSubtext}>
              Room becomes immediately available
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Actions — side by side */}
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <PrimaryButton
                title="End Meeting"
                onPress={onConfirm}
                variant="danger"
                size="medium"
                fullWidth
                loading={isLoading}
              />
            </View>
            <View style={styles.actionButton}>
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

          {/* Disclaimer */}
          <Text style={styles.disclaimerText}>
            The meeting organizer will be notified via email
          </Text>

      </View>
    </View>
  );
};

// Screen wrapper component for context-based navigation
export const EndEarlyScreen: React.FC = () => {
  const { setCurrentScreen } = useRoomState();

  return (
    <EndEarlyModal
      visible={true}
      onClose={() => setCurrentScreen('meeting')}
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 680,
    ...shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  meetingInfo: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  meetingTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  meetingOrganizer: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  timeSavedContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  timeSavedLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  timeSavedValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  timeSavedSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
  disclaimerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default EndEarlyModal;

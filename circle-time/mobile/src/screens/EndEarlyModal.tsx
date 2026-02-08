'use client';

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⏹</Text>
            </View>
            <Text style={styles.title}>End Meeting Early?</Text>
          </View>

          {/* Meeting Info */}
          {roomState?.currentMeeting && (
            <View style={styles.meetingInfo}>
              <Text style={styles.meetingTitle}>
                {roomState.currentMeeting.title}
              </Text>
              <Text style={styles.meetingOrganizer}>
                {roomState.currentMeeting.organizer}
              </Text>
            </View>
          )}

          {/* Time Saved */}
          <View style={styles.timeSavedContainer}>
            <Text style={styles.timeSavedLabel}>This will free up</Text>
            <Text style={styles.timeSavedValue}>{timeSaved} minutes</Text>
            <Text style={styles.timeSavedSubtext}>
              The room will become immediately available for others
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <PrimaryButton
              title="End Meeting"
              onPress={onConfirm}
              variant="danger"
              size="large"
              fullWidth
              loading={isLoading}
            />
            <View style={styles.actionSpacer} />
            <PrimaryButton
              title="Cancel"
              onPress={onClose}
              variant="outline"
              size="large"
              fullWidth
              disabled={isLoading}
            />
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
              The meeting organizer will be notified via email
            </Text>
          </View>
        </View>
      </View>
    </Modal>
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
    padding: spacing.xl,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 500,
    ...shadows.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  meetingInfo: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  meetingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  meetingOrganizer: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  timeSavedContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  timeSavedLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  timeSavedValue: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  timeSavedSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  actions: {
    marginBottom: spacing.lg,
  },
  actionSpacer: {
    height: spacing.md,
  },
  disclaimerContainer: {
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default EndEarlyModal;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { generatePairingCode, pollPairingStatus } from '../services/api';

interface PairingScreenProps {
  /** Called when pairing completes — parent should persist roomId and switch screen. */
  onPaired: (roomId: string) => void;
}

export const PairingScreen: React.FC<PairingScreenProps> = ({ onPaired }) => {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [status, setStatus] = useState<'loading' | 'pending' | 'expired' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Generate a device serial (persisted for the session) ────────────────
  const deviceSerialRef = useRef<string>(
    `tablet-${Math.random().toString(36).substring(2, 10)}`,
  );

  // ── Request a new pairing code from the backend ─────────────────────────
  const requestCode = useCallback(async () => {
    setStatus('loading');
    setErrorMsg(null);

    const result = await generatePairingCode(deviceSerialRef.current);
    if (result.success && result.data) {
      setCode(result.data.code);
      const exp = new Date(result.data.expiresAt);
      setExpiresAt(exp);
      setSecondsLeft(Math.max(0, Math.floor((exp.getTime() - Date.now()) / 1000)));
      setStatus('pending');
    } else {
      setStatus('error');
      setErrorMsg(result.message || 'Failed to generate pairing code');
    }
  }, []);

  // ── Initial code request ───────────────────────────────────────────────
  useEffect(() => {
    requestCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Countdown timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'pending' || !expiresAt) return;

    countdownRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((expiresAt.getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        setStatus('expired');
      }
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status, expiresAt]);

  // ── Poll pairing status every 3 seconds ────────────────────────────────
  useEffect(() => {
    if (status !== 'pending' || !code) return;

    pollRef.current = setInterval(async () => {
      const result = await pollPairingStatus(code);
      if (!result.success) return;

      if (result.data?.status === 'paired' && result.data.roomId) {
        onPaired(result.data.roomId);
      } else if (result.data?.status === 'expired') {
        setStatus('expired');
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, code, onPaired]);

  // ── Auto-regenerate when expired ───────────────────────────────────────
  useEffect(() => {
    if (status === 'expired') {
      // Small delay so the user sees "expired" briefly
      const timer = setTimeout(() => requestCode(), 2000);
      return () => clearTimeout(timer);
    }
  }, [status, requestCode]);

  // ── Format mm:ss ───────────────────────────────────────────────────────
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Logo / Title */}
        <Text style={styles.title}>Circle Time</Text>
        <Text style={styles.subtitle}>Meeting Room Display</Text>

        <View style={styles.divider} />

        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.message}>Generating pairing code…</Text>
          </>
        )}

        {status === 'pending' && code && (
          <>
            <Text style={styles.label}>Enter this code on the admin dashboard</Text>
            <Text style={styles.code}>
              {code.slice(0, 3)} {code.slice(3)}
            </Text>
            <Text style={styles.timer}>Expires in {formatTime(secondsLeft)}</Text>
            <Text style={styles.hint}>
              Waiting for admin to pair this device…
            </Text>
          </>
        )}

        {status === 'expired' && (
          <>
            <Text style={styles.expiredLabel}>Code expired</Text>
            <Text style={styles.message}>Generating a new code…</Text>
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginTop: spacing.md }}
            />
          </>
        )}

        {status === 'error' && (
          <>
            <Text style={styles.errorLabel}>Something went wrong</Text>
            <Text style={styles.message}>{errorMsg}</Text>
            <Text
              style={styles.retry}
              onPress={requestCode}
            >
              Tap to retry
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '80%',
    maxWidth: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  code: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    letterSpacing: 16,
    marginBottom: spacing.md,
  },
  timer: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.warning,
    marginBottom: spacing.lg,
  },
  hint: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  expiredLabel: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  errorLabel: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  retry: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginTop: spacing.lg,
    textDecorationLine: 'underline',
  },
});

export default PairingScreen;

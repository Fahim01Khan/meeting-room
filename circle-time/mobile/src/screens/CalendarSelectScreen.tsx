'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';
import { getCalendarAuthUrl, checkCalendarConnected } from '../services/api';

// ── Provider definitions ──────────────────────────────────────────────────────

interface CalendarProvider {
  id: string;
  name: string;
  iconText: string;
  iconColor: string;
  iconBg: string;
}

const PROVIDERS: CalendarProvider[] = [
  {
    id: 'google',
    name: 'Google',
    iconText: 'G',
    iconColor: '#4285F4',
    iconBg: '#FFFFFF',
  },
  {
    id: 'microsoft',
    name: 'Microsoft 365',
    iconText: '⊞',
    iconColor: '#FFFFFF',
    iconBg: '#0078D4',
  },
  {
    id: 'exchange',
    name: 'Exchange',
    iconText: 'E',
    iconColor: '#FFFFFF',
    iconBg: '#0078D4',
  },
  {
    id: 'zoho',
    name: 'Zoho',
    iconText: 'Z',
    iconColor: '#FFFFFF',
    iconBg: '#E42527',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

type OAuthPhase = 'select' | 'waiting' | 'connected' | 'timeout';

export const CalendarSelectScreen: React.FC = () => {
  const { setCurrentScreen, primaryColour } = useRoomState();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const accent = primaryColour || colors.primary;

  // OAuth polling state
  const [phase, setPhase] = useState<OAuthPhase>('select');
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadlineRef = useRef<number>(0);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback((provider: string) => {
    setPhase('waiting');
    setConnectingProvider(provider);
    pollDeadlineRef.current = Date.now() + 90_000; // 90 seconds

    pollTimerRef.current = setInterval(async () => {
      // Check timeout
      if (Date.now() > pollDeadlineRef.current) {
        stopPolling();
        setPhase('timeout');
        return;
      }

      const oauthProvider = provider === 'exchange' ? 'microsoft' : provider;
      const connected = await checkCalendarConnected(oauthProvider);
      if (connected) {
        stopPolling();
        setPhase('connected');
        // Show "Connected!" for 1.5 seconds then go to idle
        setTimeout(() => setCurrentScreen('idle'), 1500);
      }
    }, 3000);
  }, [stopPolling, setCurrentScreen]);

  const toggleProvider = (id: string) => {
    if (phase !== 'select') return; // Ignore taps while polling
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConnect = async () => {
    if (selected.size === 0) {
      setCurrentScreen('idle');
      return;
    }
    // Connect first selected provider (multi-provider can be done one at a time)
    const provider = Array.from(selected)[0];
    // Map 'exchange' to 'microsoft' for OAuth
    const oauthProvider = (provider === 'exchange' ? 'microsoft' : provider) as 'google' | 'microsoft' | 'zoho';
    const url = await getCalendarAuthUrl(oauthProvider);
    if (url) {
      await Linking.openURL(url);
      // Start polling for the token instead of a blind setTimeout
      startPolling(provider);
    } else {
      Alert.alert('Error', 'Could not get calendar URL. Try again later.');
    }
  };

  const handleRetry = () => {
    setPhase('select');
    setConnectingProvider(null);
  };

  const handleSkip = () => {
    stopPolling();
    setCurrentScreen('idle');
  };

  // ── Provider card ─────────────────────────────────────────────────────────
  const renderProviderCard = (provider: CalendarProvider) => {
    const isSelected = selected.has(provider.id);
    return (
      <TouchableOpacity
        key={provider.id}
        style={[
          styles.card,
          isSelected && { borderColor: accent, borderWidth: 3 },
        ]}
        onPress={() => toggleProvider(provider.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: provider.iconBg }]}>
          <Text
            style={[
              styles.iconText,
              { color: provider.iconColor },
            ]}
          >
            {provider.iconText}
          </Text>
        </View>
        <Text style={styles.cardLabel}>{provider.name}</Text>
        {isSelected && (
          <View style={[styles.checkBadge, { backgroundColor: accent }]}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── OAuth status overlay ───────────────────────────────────────────────
  const renderOAuthStatus = () => {
    if (phase === 'waiting') {
      return (
        <View style={styles.statusOverlay}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={[styles.statusTitle, { color: accent }]}>
            Waiting for calendar connection…
          </Text>
          <Text style={styles.statusSubtext}>
            Complete the sign-in in the browser.{'\n'}
            This screen will update automatically.
          </Text>
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: accent }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (phase === 'connected') {
      return (
        <View style={styles.statusOverlay}>
          <Text style={styles.connectedIcon}>✓</Text>
          <Text style={[styles.statusTitle, { color: colors.success }]}>
            Connected!
          </Text>
        </View>
      );
    }

    if (phase === 'timeout') {
      return (
        <View style={styles.statusOverlay}>
          <Text style={styles.timeoutIcon}>⏱</Text>
          <Text style={[styles.statusTitle, { color: colors.textSecondary }]}>
            Connection timed out.
          </Text>
          <Text style={styles.statusSubtext}>
            Try again or skip for now.
          </Text>
          <PrimaryButton
            title="Try Again"
            onPress={handleRetry}
            variant="primary"
            size="large"
            style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xxl }}
          />
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: accent }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // ── Landscape layout ──────────────────────────────────────────────────────
  if (isLandscape) {
    // Show OAuth status overlay when not in select phase
    if (phase !== 'select') {
      return (
        <View style={styles.container}>
          {renderOAuthStatus()}
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.landscapeBody}>
          {/* Left — header text */}
          <View style={styles.leftCol}>
            <View>
              <Text style={[styles.title, { color: accent }]}>
                Connect Your Calendar
              </Text>
              <Text style={styles.subtitle}>
                Select the calendar Circle Time should sync with.{'\n'}
                You can connect more than one.
              </Text>
            </View>

            {/* Footer actions */}
            <View style={styles.leftFooter}>
              <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
                <Text style={[styles.skipText, { color: accent }]}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right — provider grid + connect button */}
          <View style={styles.rightCol}>
            <View style={styles.providerRow}>
              {PROVIDERS.map(renderProviderCard)}
            </View>

            <View style={styles.connectBtnWrap}>
              <PrimaryButton
                title="Connect"
                onPress={handleConnect}
                variant="primary"
                size="large"
                style={{ paddingHorizontal: spacing.xxl }}
                disabled={selected.size === 0}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── Portrait layout ───────────────────────────────────────────────────────

  // Show OAuth status overlay when not in select phase
  if (phase !== 'select') {
    return (
      <View style={[styles.container, styles.portraitWrap, { justifyContent: 'center' }]}>
        {renderOAuthStatus()}
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.portraitWrap]}>
      <View style={styles.portraitHeader}>
        <Text style={[styles.title, { color: accent }]}>
          Connect Your Calendar
        </Text>
        <Text style={styles.subtitle}>
          Select the calendar Circle Time should sync with.{'\n'}
          You can connect more than one.
        </Text>
      </View>

      <View style={styles.providerRow}>
        {PROVIDERS.map(renderProviderCard)}
      </View>

      <View style={styles.portraitFooter}>
        <PrimaryButton
          title="Connect"
          onPress={handleConnect}
          variant="primary"
          size="large"
          fullWidth
          disabled={selected.size === 0}
        />
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.7}
          style={styles.skipBtn}
        >
          <Text style={[styles.skipText, { color: accent }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /* ── Core ─────────────────────────────────────────────────────────────── */
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },

  /* ── Landscape ────────────────────────────────────────────────────────── */
  landscapeBody: { flex: 1, flexDirection: 'row' },

  leftCol: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.light,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.light,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.lg * 1.5,
  },
  leftFooter: {
    alignItems: 'flex-start',
  },
  skipText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },

  rightCol: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: spacing.xl,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  connectBtnWrap: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },

  /* ── Provider card ────────────────────────────────────────────────────── */
  card: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  cardLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },

  /* ── Portrait ─────────────────────────────────────────────────────────── */
  portraitWrap: { justifyContent: 'space-between' },
  portraitHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  portraitFooter: {
    marginTop: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: spacing.sm,
  },

  /* ── OAuth status overlay ─────────────────────────────────────────────── */
  statusOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  statusTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.light,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: typography.fontSize.lg * 1.5,
  },
  connectedIcon: {
    fontSize: 64,
    color: colors.success,
  },
  timeoutIcon: {
    fontSize: 48,
    color: colors.textSecondary,
  },
});

export default CalendarSelectScreen;

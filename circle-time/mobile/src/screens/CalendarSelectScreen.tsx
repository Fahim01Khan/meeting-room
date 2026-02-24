'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoomState } from '../context/RoomStateContext';

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

export const CalendarSelectScreen: React.FC = () => {
  const { setCurrentScreen, primaryColour } = useRoomState();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const accent = primaryColour || colors.primary;

  const toggleProvider = (id: string) => {
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

  const handleConnect = () => {
    Alert.alert(
      'Coming Soon',
      'Calendar sync coming soon. You can connect calendars later in Settings.',
      [{ text: 'OK', onPress: () => setCurrentScreen('idle') }],
    );
  };

  const handleSkip = () => {
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

  // ── Landscape layout ──────────────────────────────────────────────────────
  if (isLandscape) {
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
});

export default CalendarSelectScreen;

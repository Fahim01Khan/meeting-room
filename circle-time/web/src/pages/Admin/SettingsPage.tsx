import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSettings, updateSettings } from '../../services/organisation';
import type { OrgSettings, OrgSettingsUpdate } from '../../services/organisation';
import { fetchCalendarTokens, getCalendarAuthUrl, disconnectCalendar } from '../../services/calendar';
import type { CalendarToken } from '../../services/calendar';
import { ApiClientError } from '../../services/api';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';
import { useOrgSettings } from '../../context/OrgSettingsContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIMEZONES = [
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'Africa/Lagos',
  'Africa/Cairo',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Singapore',
];

// ── Component ─────────────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const [saved, setSaved] = useState<OrgSettings | null>(null);
  const [draft, setDraft] = useState<OrgSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { refresh: refreshOrgSettings } = useOrgSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [calendarTokens, setCalendarTokens] = useState<CalendarToken[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarToast, setCalendarToast] = useState<string | null>(null);
  const [calendarToastType, setCalendarToastType] = useState<'success' | 'error'>('success');

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchSettings();
      setSaved(data);
      setDraft(data);
    } catch {
      setLoadError('Failed to load organisation settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ── Calendar tokens ───────────────────────────────────────────────────────

  const loadCalendarTokens = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const tokens = await fetchCalendarTokens();
      setCalendarTokens(tokens);
    } catch {
      // silently fail — calendar section just shows "not connected"
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendarTokens();
  }, [loadCalendarTokens]);

  // Check URL params for OAuth callback result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarStatus = params.get('calendar');
    if (calendarStatus === 'connected') {
      const provider = params.get('provider') || 'Calendar';
      const label = provider === 'microsoft' ? 'Microsoft 365' : provider.charAt(0).toUpperCase() + provider.slice(1);
      setCalendarToast(`${label} Calendar connected successfully!`);
      setCalendarToastType('success');
      setTimeout(() => setCalendarToast(null), 5000);
      window.history.replaceState({}, '', '/admin/settings');
      loadCalendarTokens();
    } else if (calendarStatus === 'error') {
      const reason = params.get('reason') || 'unknown';
      setCalendarToast(`Calendar connection failed: ${reason}`);
      setCalendarToastType('error');
      setTimeout(() => setCalendarToast(null), 5000);
      window.history.replaceState({}, '', '/admin/settings');
    }
  }, [loadCalendarTokens]);

  const handleConnect = async (provider: string) => {
    try {
      const { authUrl } = await getCalendarAuthUrl(provider);
      window.location.href = authUrl;
    } catch {
      setCalendarToast(`Failed to get ${provider} auth URL`);
      setCalendarToastType('error');
      setTimeout(() => setCalendarToast(null), 5000);
    }
  };

  const handleDisconnect = async (provider: string) => {
    const label = provider === 'microsoft' ? 'Microsoft 365' : provider.charAt(0).toUpperCase() + provider.slice(1);
    if (!window.confirm(`Disconnect ${label} Calendar?`)) return;
    try {
      await disconnectCalendar(provider);
      await loadCalendarTokens();
      setCalendarToast(`${label} Calendar disconnected`);
      setCalendarToastType('success');
      setTimeout(() => setCalendarToast(null), 3000);
    } catch {
      setCalendarToast(`Failed to disconnect ${label}`);
      setCalendarToastType('error');
      setTimeout(() => setCalendarToast(null), 5000);
    }
  };

  // Detect if draft differs from saved
  const isDirty = draft && saved && JSON.stringify(draft) !== JSON.stringify(saved);

  // ── Field helpers ──────────────────────────────────────────────────────────

  const setField = <K extends keyof OrgSettings>(key: K, value: OrgSettings[K]) => {
    setDraft((prev) => prev ? { ...prev, [key]: value } : prev);
    setSaveError(null);
  };

  const toggleDay = (day: number) => {
    if (!draft) return;
    const days = draft.businessDays.includes(day)
      ? draft.businessDays.filter((d) => d !== day)
      : [...draft.businessDays, day].sort((a, b) => a - b);
    setField('businessDays', days);
  };

  // ── Logo URL preview validity ──────────────────────────────────────────────

  const isValidUrl = (url: string | null) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isBase64Image = (url: string | null) => {
    return url ? url.startsWith('data:image/') : false;
  };

  const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const handleFileSelect = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setSaveError('Invalid file type. Please use PNG, JPEG, WebP, or SVG.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setSaveError('File too large. Maximum size is 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setField('logoUrl', dataUrl);
      setSaveError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!draft || !saved) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload: OrgSettingsUpdate = {};
      (Object.keys(draft) as Array<keyof OrgSettings>).forEach((k) => {
        if (k === 'updatedAt') return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (JSON.stringify((draft as any)[k]) !== JSON.stringify((saved as any)[k])) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload as any)[k] = (draft as any)[k];
        }
      });
      const updated = await updateSettings(payload);
      setSaved(updated);
      setDraft(updated);
      refreshOrgSettings(updated);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSaveError(err.message);
      } else {
        setSaveError('Failed to save settings — please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: spacing.xl,
    maxWidth: '760px',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: spacing.xl,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  };

  const sectionCardStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    boxShadow: shadows.sm,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginTop: 0,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottom: `1px solid ${colors.border}`,
  };

  const fieldRowStyle: React.CSSProperties = {
    marginBottom: spacing.lg,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  };

  const hintStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    backgroundColor: colors.background,
    boxSizing: 'border-box',
    outline: 'none',
  };

  const numberInputStyle: React.CSSProperties = {
    ...inputStyle,
    width: '120px',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const saveBtnStyle: React.CSSProperties = {
    padding: `${spacing.md} ${spacing.xl}`,
    backgroundColor: isDirty ? colors.primary : colors.backgroundSecondary,
    color: isDirty ? colors.background : colors.textMuted,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    cursor: isDirty ? 'pointer' : 'not-allowed',
  };

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.success,
    color: '#fff',
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    boxShadow: shadows.lg,
    zIndex: 2000,
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: colors.errorLight,
    color: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={pageStyle}>
        <div style={{ color: colors.textSecondary, fontSize: typography.fontSize.base }}>
          Loading settings…
        </div>
      </div>
    );
  }

  if (loadError || !draft) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle}>{loadError ?? 'Failed to load settings.'}</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Organisation Settings</h1>
        <p style={subtitleStyle}>Configure branding, check-in behaviour, and business hours</p>
      </div>

      {/* ── Section 1: Branding ──────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Branding</h2>

        {/* Organisation Name */}
        <div style={fieldRowStyle}>
          <label style={labelStyle} htmlFor="orgName">Organisation Name</label>
          <input
            id="orgName"
            type="text"
            style={inputStyle}
            value={draft.orgName}
            onChange={(e) => setField('orgName', e.target.value)}
          />
        </div>

        {/* Primary Colour */}
        <div style={fieldRowStyle}>
          <label style={labelStyle} htmlFor="primaryColour">Primary Colour</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <input
              id="primaryColour"
              type="color"
              value={draft.primaryColour}
              onChange={(e) => setField('primaryColour', e.target.value)}
              style={{
                width: '48px',
                height: '40px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                padding: '2px',
                backgroundColor: colors.background,
              }}
            />
            <input
              type="text"
              style={{ ...inputStyle, width: '120px' }}
              value={draft.primaryColour}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  setField('primaryColour', val);
                }
              }}
              maxLength={7}
              placeholder="#1E8ACC"
            />
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: borderRadius.md,
              backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(draft.primaryColour) ? draft.primaryColour : colors.backgroundSecondary,
              border: `1px solid ${colors.border}`,
              flexShrink: 0,
            }} />
          </div>
        </div>

        {/* Logo URL */}
        <div style={fieldRowStyle}>
          <label style={labelStyle} htmlFor="logoUrl">Logo URL</label>
          {!isBase64Image(draft.logoUrl) && (
            <input
              id="logoUrl"
              type="url"
              style={inputStyle}
              value={draft.logoUrl ?? ''}
              onChange={(e) => setField('logoUrl', e.target.value || null)}
              placeholder="https://example.com/logo.png"
            />
          )}
          {(isValidUrl(draft.logoUrl) || isBase64Image(draft.logoUrl)) && (
            <div style={{ marginTop: spacing.sm, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <img
                src={draft.logoUrl!}
                alt="Logo preview"
                style={{
                  maxHeight: '48px',
                  maxWidth: '200px',
                  objectFit: 'contain',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.sm,
                  padding: '4px',
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {isBase64Image(draft.logoUrl) && (
                <button
                  type="button"
                  onClick={() => setField('logoUrl', null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: typography.fontSize.lg,
                    color: colors.textMuted,
                    lineHeight: 1,
                  }}
                  title="Clear uploaded image"
                >
                  ×
                </button>
              )}
            </div>
          )}
          {!isBase64Image(draft.logoUrl) && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                marginTop: spacing.sm,
                padding: spacing.lg,
                border: `2px dashed ${isDragging ? colors.primary : colors.border}`,
                borderRadius: borderRadius.md,
                backgroundColor: isDragging ? colors.primaryLight : colors.backgroundSecondary,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s',
              }}
            >
              <p style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
                📁 Drop image here or click to browse
              </p>
              <p style={{ margin: `${spacing.xs} 0 0`, fontSize: typography.fontSize.xs, color: colors.textMuted }}>
                PNG, JPEG, WebP, or SVG · Max 2MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                  e.target.value = '';
                }}
              />
            </div>
          )}
          <p style={hintStyle}>Logo appears on the tablet door-panel display only</p>
        </div>
      </div>

      {/* ── Section 2: Check-in Settings ─────────────────────────────── */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Check-in Settings</h2>

        {/* Check-in Window */}
        <div style={fieldRowStyle}>
          <label style={labelStyle} htmlFor="checkinWindow">Check-in Window (minutes)</label>
          <input
            id="checkinWindow"
            type="number"
            style={numberInputStyle}
            value={draft.checkinWindowMinutes}
            min={5}
            max={60}
            onChange={(e) => setField('checkinWindowMinutes', Math.max(5, Math.min(60, Number(e.target.value))))}
          />
          <p style={hintStyle}>How many minutes before a meeting starts can attendees check in</p>
        </div>

        {/* Auto-release */}
        <div style={{ ...fieldRowStyle, marginBottom: 0 }}>
          <label style={labelStyle} htmlFor="autoRelease">Auto-release Window (minutes)</label>
          <input
            id="autoRelease"
            type="number"
            style={numberInputStyle}
            value={draft.autoReleaseMinutes}
            min={5}
            max={60}
            onChange={(e) => setField('autoReleaseMinutes', Math.max(5, Math.min(60, Number(e.target.value))))}
          />
          <p style={hintStyle}>
            Release the room if nobody checks in within this many minutes of the meeting start
          </p>
        </div>
      </div>

      {/* ── Section 3: Calendar Integration ───────────────────────────── */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Calendar Integration</h2>

        {calendarLoading ? (
          <p style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
            Loading calendar connections…
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {([
              { id: 'google',    label: 'Google Calendar' },
              { id: 'microsoft', label: 'Microsoft 365' },
              { id: 'exchange',  label: 'Microsoft Exchange' },
              { id: 'zoho',      label: 'Zoho Calendar' },
            ] as const).map((prov) => {
              const token = calendarTokens.find((t) => t.provider === prov.id);
              const connected = !!token?.connected;
              const expired = !!token?.expired;

              let badgeText = 'Not connected';
              let badgeColor = colors.textMuted;
              let badgeBg = colors.backgroundSecondary;
              if (connected && !expired) {
                badgeText = 'Connected';
                badgeColor = '#166534';
                badgeBg = '#dcfce7';
              } else if (connected && expired) {
                badgeText = 'Expired';
                badgeColor = '#9a3412';
                badgeBg = '#fed7aa';
              }

              return (
                <div
                  key={prov.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${spacing.md} ${spacing.lg}`,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.background,
                  }}
                >
                  <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, color: colors.text }}>
                    {prov.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                    <span
                      style={{
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.medium,
                        color: badgeColor,
                        backgroundColor: badgeBg,
                        padding: `2px ${spacing.sm}`,
                        borderRadius: borderRadius.full,
                      }}
                    >
                      {badgeText}
                    </span>
                    {connected ? (
                      <button
                        type="button"
                        onClick={() => handleDisconnect(prov.id)}
                        style={{
                          padding: `${spacing.xs} ${spacing.md}`,
                          border: `1px solid ${colors.error}`,
                          borderRadius: borderRadius.md,
                          backgroundColor: colors.background,
                          color: colors.error,
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.medium,
                          cursor: 'pointer',
                        }}
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnect(prov.id === 'exchange' ? 'microsoft' : prov.id)}
                        style={{
                          padding: `${spacing.xs} ${spacing.md}`,
                          border: `1px solid ${colors.primary}`,
                          borderRadius: borderRadius.md,
                          backgroundColor: colors.primary,
                          color: '#fff',
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.medium,
                          cursor: 'pointer',
                        }}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 4: Business Hours ─────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Business Hours</h2>

        {/* Days */}
        <div style={fieldRowStyle}>
          <label style={labelStyle}>Active Days</label>
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            {DAY_LABELS.map((label, idx) => {
              const active = draft.businessDays.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderRadius: borderRadius.md,
                    border: `1px solid ${active ? draft.primaryColour : colors.border}`,
                    backgroundColor: active ? draft.primaryColour : colors.background,
                    color: active ? '#fff' : colors.textSecondary,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    cursor: 'pointer',
                    minWidth: '52px',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start / End times */}
        <div style={{ ...fieldRowStyle, display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle} htmlFor="businessStart">Start Time</label>
            <input
              id="businessStart"
              type="time"
              style={inputStyle}
              value={draft.businessStart}
              onChange={(e) => setField('businessStart', e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle} htmlFor="businessEnd">End Time</label>
            <input
              id="businessEnd"
              type="time"
              style={inputStyle}
              value={draft.businessEnd}
              onChange={(e) => setField('businessEnd', e.target.value)}
            />
          </div>
        </div>

        {/* Timezone */}
        <div style={{ ...fieldRowStyle, marginBottom: 0 }}>
          <label style={labelStyle} htmlFor="timezone">Timezone</label>
          <select
            id="timezone"
            style={selectStyle}
            value={draft.timezone}
            onChange={(e) => setField('timezone', e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Save bar ──────────────────────────────────────────────────── */}
      {saveError && <div style={errorStyle}>{saveError}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          style={saveBtnStyle}
          disabled={!isDirty || isSaving}
          onClick={handleSave}
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* ── Success toast ──────────────────────────────────────────────── */}
      {showSuccess && (
        <div style={toastStyle}>
          ✓ Settings saved
        </div>
      )}

      {/* ── Calendar toast ─────────────────────────────────────────────── */}
      {calendarToast && (
        <div style={{
          ...toastStyle,
          backgroundColor: calendarToastType === 'success' ? colors.success : colors.error,
          bottom: showSuccess ? `calc(${spacing.xl} + 56px)` : spacing.xl,
        }}>
          {calendarToastType === 'success' ? '✓' : '✕'} {calendarToast}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

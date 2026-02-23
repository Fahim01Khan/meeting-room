import React, { useState, useEffect, useCallback } from 'react';
import { fetchDevices } from '../../services/devices';
import type { DeviceRegistration } from '../../services/devices';
import { PairingModal } from './PairingModal';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPairingModal, setShowPairingModal] = useState(false);

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDevices();
      setDevices(data);
    } catch {
      setError('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // ── Styles ─────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: spacing.xl,
    maxWidth: '960px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  const pairBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.primary,
    color: colors.background,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
  };

  const tableCardStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
    boxShadow: shadows.sm,
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    padding: `${spacing.md} ${spacing.lg}`,
    textAlign: 'left',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.backgroundSecondary,
  };

  const tdStyle: React.CSSProperties = {
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    borderBottom: `1px solid ${colors.border}`,
  };

  const badgeStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: `2px ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    backgroundColor: active ? colors.successLight : colors.errorLight,
    color: active ? colors.success : colors.error,
  });

  const emptyStyle: React.CSSProperties = {
    padding: spacing.xxl,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Devices</h1>
          <p style={subtitleStyle}>
            Paired tablets mapped to meeting rooms
          </p>
        </div>
        <button
          type="button"
          style={pairBtnStyle}
          onClick={() => setShowPairingModal(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Pair New Device
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: colors.errorLight,
          color: colors.error,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.lg,
          fontSize: typography.fontSize.sm,
        }}>
          {error}
        </div>
      )}

      <div style={tableCardStyle}>
        {isLoading ? (
          <div style={emptyStyle}>Loading devices…</div>
        ) : devices.length === 0 ? (
          <div style={emptyStyle}>
            No devices paired yet.{' '}
            <button
              type="button"
              style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
              onClick={() => setShowPairingModal(true)}
            >
              Pair your first device →
            </button>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Room</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Device Serial</th>
                <th style={thStyle}>Paired At</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: typography.fontWeight.medium }}>
                      {device.roomName}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }}>
                    {device.roomBuilding}, Floor {device.roomFloor}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: typography.fontSize.xs }}>
                    {device.deviceSerial}
                  </td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }}>
                    {new Date(device.registeredAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(device.isActive)}>
                      {device.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PairingModal
        isOpen={showPairingModal}
        onClose={() => setShowPairingModal(false)}
        onSuccess={loadDevices}
      />
    </div>
  );
};

export default DevicesPage;

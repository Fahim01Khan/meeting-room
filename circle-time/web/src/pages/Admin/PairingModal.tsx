import React, { useState, useEffect } from 'react';
import { fetchRooms } from '../../services/rooms';
import { pairDevice } from '../../services/devices';
import { ApiClientError } from '../../services/api';
import type { Room } from '../../types/room';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCode('');
    setRoomId('');
    setError(null);
    setSuccessMsg(null);
    fetchRooms()
      .then(setRooms)
      .catch(() => setError('Failed to load rooms'));
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6 || !roomId) {
      setError('Enter a 6-digit code and select a room');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await pairDevice(code.trim(), roomId);
      setSuccessMsg(`Tablet paired to ${result.roomName}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Something went wrong — please try again');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    width: '460px',
    boxShadow: shadows.lg,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.md} ${spacing.md}`,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    boxSizing: 'border-box',
    outline: 'none',
  };

  const buttonRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.xl,
  };

  const primaryBtn: React.CSSProperties = {
    padding: `${spacing.md} ${spacing.xl}`,
    backgroundColor: isSubmitting ? colors.primaryLight : colors.primary,
    color: colors.background,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
  };

  const cancelBtn: React.CSSProperties = {
    padding: `${spacing.md} ${spacing.xl}`,
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    cursor: 'pointer',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>Pair New Tablet</h2>
        <p style={{ color: colors.textSecondary, marginBottom: spacing.lg, fontSize: typography.fontSize.sm }}>
          Enter the 6-digit code displayed on the tablet, then select the room it should display.
        </p>

        {successMsg && (
          <div style={{
            backgroundColor: colors.successLight,
            color: colors.success,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
          }}>
            ✓ {successMsg}
          </div>
        )}

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: spacing.lg }}>
            <label htmlFor="pairing-code" style={labelStyle}>
              6-Digit Pairing Code
            </label>
            <input
              id="pairing-code"
              type="text"
              maxLength={6}
              placeholder="e.g. 482910"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{
                ...inputStyle,
                letterSpacing: '0.3em',
                fontSize: typography.fontSize.xl,
                textAlign: 'center',
              }}
            />
          </div>

          <div style={{ marginBottom: spacing.md }}>
            <label htmlFor="room-select" style={labelStyle}>
              Room
            </label>
            <select
              id="room-select"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{ ...inputStyle, backgroundColor: colors.background }}
            >
              <option value="">Select a room…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.building}, Floor {r.floor}
                </option>
              ))}
            </select>
          </div>

          <div style={buttonRow}>
            <button type="button" style={cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={primaryBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Pairing…' : 'Pair Tablet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PairingModal;

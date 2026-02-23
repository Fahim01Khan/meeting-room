import React, { useState, useEffect } from 'react';
import { sendInvitation } from '../../services/users';
import { ApiClientError } from '../../services/api';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEmail('');
    setRole('user');
    setDepartment('');
    setError(null);
    setSuccessMsg(null);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await sendInvitation({
        email: email.trim(),
        role,
        department: department.trim() || undefined,
      });
      setSuccessMsg(`Invitation sent to ${result.email}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Something went wrong — please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ── Styles ──────────────────────────────────────────────────────────────

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
    marginTop: 0,
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
    backgroundColor: colors.background,
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
        <h2 style={titleStyle}>Invite User</h2>
        <p style={{ color: colors.textSecondary, marginBottom: spacing.lg, fontSize: typography.fontSize.sm }}>
          Send an email invitation to join Circle Time.
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
            <label htmlFor="invite-email" style={labelStyle}>Email Address *</label>
            <input
              id="invite-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <label htmlFor="invite-role" style={labelStyle}>Role</label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={inputStyle}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div style={{ marginBottom: spacing.md }}>
            <label htmlFor="invite-dept" style={labelStyle}>Department (optional)</label>
            <input
              id="invite-dept"
              type="text"
              placeholder="e.g. Engineering"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={buttonRow}>
            <button type="button" style={cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={primaryBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;

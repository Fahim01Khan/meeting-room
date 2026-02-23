import React, { useState, useEffect, useCallback } from 'react';
import { fetchUsers, fetchInvitations, cancelInvitation } from '../../services/users';
import type { UserRecord, InvitationRecord } from '../../services/users';
import { InviteModal } from './InviteModal';
import { ApiClientError } from '../../services/api';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const loadInvitations = useCallback(async () => {
    setIsLoadingInvites(true);
    try {
      const data = await fetchInvitations();
      setInvitations(data);
    } catch {
      setError('Failed to load invitations.');
    } finally {
      setIsLoadingInvites(false);
    }
  }, []);

  const loadAll = useCallback(() => {
    setError(null);
    loadUsers();
    loadInvitations();
  }, [loadUsers, loadInvitations]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCancel = async (id: string) => {
    try {
      await cancelInvitation(id);
      loadInvitations();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to cancel invitation.');
      }
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: spacing.xl,
    maxWidth: '1040px',
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

  const inviteBtnStyle: React.CSSProperties = {
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

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.xxl,
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

  const badgeStyle = (variant: 'success' | 'warning' | 'error' | 'muted'): React.CSSProperties => {
    const map = {
      success: { bg: colors.successLight, fg: colors.success },
      warning: { bg: colors.warningLight ?? '#FEF3C7', fg: colors.warning ?? '#D97706' },
      error: { bg: colors.errorLight, fg: colors.error },
      muted: { bg: colors.backgroundSecondary, fg: colors.textMuted },
    };
    const c = map[variant];
    return {
      display: 'inline-block',
      padding: `2px ${spacing.sm}`,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      backgroundColor: c.bg,
      color: c.fg,
    };
  };

  const emptyStyle: React.CSSProperties = {
    padding: spacing.xxl,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  };

  const iconBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: spacing.xs,
    color: colors.textSecondary,
    borderRadius: borderRadius.sm,
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: typography.fontSize.xs,
  };

  const roleBadge = (role: string) =>
    role === 'admin' ? badgeStyle('success') : badgeStyle('muted');

  const statusBadge = (s: string) => {
    if (s === 'pending') return badgeStyle('warning');
    if (s === 'accepted') return badgeStyle('success');
    return badgeStyle('error');
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Users</h1>
          <p style={subtitleStyle}>Manage users and invitations</p>
        </div>
        <button type="button" style={inviteBtnStyle} onClick={() => setShowInviteModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Invite User
        </button>
      </div>

      {/* Error */}
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

      {/* ── Active Users ─────────────────────────────────────────────────── */}
      <h2 style={{ ...sectionTitleStyle, marginTop: 0 }}>Active Users</h2>
      <div style={tableCardStyle}>
        {isLoadingUsers ? (
          <div style={emptyStyle}>Loading users…</div>
        ) : users.length === 0 ? (
          <div style={emptyStyle}>No users found.</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: typography.fontWeight.medium }}>{u.name}</span>
                  </td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }}>{u.email}</td>
                  <td style={tdStyle}>
                    <span style={roleBadge(u.role)}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }}>{u.department ?? '—'}</td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }}>
                    {new Date(u.dateJoined).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pending Invitations ──────────────────────────────────────────── */}
      <h2 style={sectionTitleStyle}>Invitations</h2>
      <div style={tableCardStyle}>
        {isLoadingInvites ? (
          <div style={emptyStyle}>Loading invitations…</div>
        ) : invitations.length === 0 ? (
          <div style={emptyStyle}>
            No invitations yet.{' '}
            <button
              type="button"
              style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
              onClick={() => setShowInviteModal(true)}
            >
              Send your first invite →
            </button>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Invited By</th>
                <th style={thStyle}>Expires</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: typography.fontWeight.medium }}>{inv.email}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={roleBadge(inv.role)}>
                      {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }}>{inv.invitedBy ?? '—'}</td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }}>
                    {new Date(inv.expiresAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={tdStyle}>
                    <span style={statusBadge(inv.status)}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {inv.status === 'pending' && (
                      <button
                        type="button"
                        style={{ ...iconBtnStyle, color: colors.error }}
                        title="Cancel invitation"
                        onClick={() => handleCancel(inv.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <span style={{ marginLeft: '4px' }}>Cancel</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={loadAll}
      />
    </div>
  );
};

export default UsersPage;

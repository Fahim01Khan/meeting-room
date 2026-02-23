import React, { useState, useEffect, useCallback } from 'react';
import { fetchRooms, deleteRoom } from '../../services/rooms';
import type { Room } from '../../types/room';
import { RoomModal } from './RoomModal';
import { ApiClientError } from '../../services/api';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';

// ── Amenity display map ───────────────────────────────────────────────────────

const AMENITY_LABELS: Record<string, string> = {
  projector: 'Projector',
  whiteboard: 'Whiteboard',
  video_conference: 'Video Conferencing',
  tv_display: 'TV Screen',
  air_conditioning: 'Air Conditioning',
  phone: 'Phone',
};

// ── Component ─────────────────────────────────────────────────────────────────

export const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRooms();
      setRooms(data);
    } catch {
      setError('Failed to load rooms.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const openCreateModal = () => {
    setEditRoom(null);
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditRoom(room);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditRoom(null);
  };

  const openDeleteConfirm = (room: Room) => {
    setDeleteTarget(room);
    setDeleteError(null);
  };

  const closeDeleteConfirm = () => {
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteRoom(deleteTarget.id);
      closeDeleteConfirm();
      loadRooms();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Failed to delete room — please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────

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

  const addBtnStyle: React.CSSProperties = {
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

  const statusBadgeStyle = (s: string): React.CSSProperties => {
    const isAvail = s === 'available';
    const isMaint = s === 'maintenance';
    return {
      display: 'inline-block',
      padding: `2px ${spacing.sm}`,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      backgroundColor: isAvail ? colors.successLight : isMaint ? colors.errorLight : colors.backgroundSecondary,
      color: isAvail ? colors.success : isMaint ? colors.error : colors.textSecondary,
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
  };

  // ── Delete confirmation dialog ───────────────────────────────────────────────

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const dialogStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    width: '440px',
    boxShadow: shadows.lg,
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Rooms</h1>
          <p style={subtitleStyle}>Manage meeting rooms available for booking</p>
        </div>
        <button type="button" style={addBtnStyle} onClick={openCreateModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Add Room
        </button>
      </div>

      {/* Page-level error */}
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

      {/* Table */}
      <div style={tableCardStyle}>
        {isLoading ? (
          <div style={emptyStyle}>Loading rooms…</div>
        ) : rooms.length === 0 ? (
          <div style={emptyStyle}>
            No rooms yet.{' '}
            <button
              type="button"
              style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
              onClick={openCreateModal}
            >
              Add your first room →
            </button>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Building</th>
                <th style={thStyle}>Floor</th>
                <th style={thStyle}>Capacity</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: typography.fontWeight.medium }}>{room.name}</span>
                    {room.amenities.length > 0 && (
                      <div style={{ marginTop: '2px', fontSize: typography.fontSize.xs, color: colors.textMuted }}>
                        {room.amenities
                          .map((a) => AMENITY_LABELS[a as string] ?? a)
                          .join(', ')}
                      </div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }}>{room.building}</td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }}>{room.floor}</td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }}>{room.capacity}</td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle(room.status)}>
                      {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {/* Edit */}
                    <button
                      type="button"
                      style={iconBtnStyle}
                      title="Edit room"
                      onClick={() => openEditModal(room)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    {/* Delete */}
                    <button
                      type="button"
                      style={{ ...iconBtnStyle, color: colors.error, marginLeft: spacing.xs }}
                      title="Delete room"
                      onClick={() => openDeleteConfirm(room)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      <RoomModal
        isOpen={showModal}
        room={editRoom}
        onClose={closeModal}
        onSuccess={loadRooms}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div style={overlayStyle} onClick={closeDeleteConfirm}>
          <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text,
              marginTop: 0,
              marginBottom: spacing.md,
            }}>
              Delete Room
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm, marginBottom: spacing.lg }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: colors.text }}>{deleteTarget.name}</strong>?
              This action cannot be undone.
            </p>

            {deleteError && (
              <div style={{
                backgroundColor: colors.errorLight,
                color: colors.error,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
                fontSize: typography.fontSize.sm,
              }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md }}>
              <button
                type="button"
                style={{
                  padding: `${spacing.md} ${spacing.xl}`,
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: typography.fontSize.base,
                  cursor: 'pointer',
                }}
                onClick={closeDeleteConfirm}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  padding: `${spacing.md} ${spacing.xl}`,
                  backgroundColor: isDeleting ? colors.errorLight : colors.error,
                  color: colors.background,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;

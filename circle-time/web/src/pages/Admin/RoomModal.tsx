import React, { useState, useEffect } from 'react';
import { createRoom, updateRoom } from '../../services/rooms';
import { ApiClientError } from '../../services/api';
import type { Room } from '../../types/room';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';

// ── Amenity options matching backend AMENITY_CHOICES ─────────────────────────

const AMENITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'projector', label: 'Projector' },
  { value: 'whiteboard', label: 'Whiteboard' },
  { value: 'video_conference', label: 'Video Conferencing' },
  { value: 'tv_display', label: 'TV Screen' },
  { value: 'air_conditioning', label: 'Air Conditioning' },
  { value: 'phone', label: 'Phone' },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'maintenance', label: 'Maintenance' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface RoomModalProps {
  isOpen: boolean;
  /** Provide room to edit; omit (or null) for create mode */
  room?: Room | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  room,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(room);

  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [capacity, setCapacity] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [roomStatus, setRoomStatus] = useState('available');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (room) {
      setName(room.name);
      setBuilding(room.building);
      setFloor(String(room.floor));
      setCapacity(String(room.capacity));
      setAmenities(room.amenities as string[]);
      setRoomStatus(room.status);
    } else {
      setName('');
      setBuilding('');
      setFloor('');
      setCapacity('');
      setAmenities([]);
      setRoomStatus('available');
    }
    setError(null);
  }, [isOpen, room]);

  const toggleAmenity = (value: string) => {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      name: name.trim(),
      building: building.trim(),
      floor: parseInt(floor, 10),
      capacity: parseInt(capacity, 10),
      amenities,
      status: roomStatus,
    };

    if (!payload.name) { setError('Room name is required.'); return; }
    if (!payload.building) { setError('Building is required.'); return; }
    if (isNaN(payload.floor)) { setError('Floor must be a number.'); return; }
    if (isNaN(payload.capacity)) { setError('Capacity must be a number.'); return; }

    setIsSubmitting(true);
    try {
      if (isEdit && room) {
        await updateRoom(room.id, payload);
      } else {
        await createRoom(payload);
      }
      onSuccess();
      onClose();
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

  // ── Styles ──────────────────────────────────────────────────────────────────

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
    width: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
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
    backgroundColor: colors.background,
    boxSizing: 'border-box',
    outline: 'none',
  };

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.md,
    marginBottom: spacing.lg,
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: spacing.lg,
  };

  const amenityGridStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  };

  const amenityChipStyle = (active: boolean): React.CSSProperties => ({
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    border: `1px solid ${active ? colors.primary : colors.border}`,
    backgroundColor: active ? colors.primaryLight : 'transparent',
    color: active ? colors.primary : colors.textSecondary,
    userSelect: 'none',
  });

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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>{isEdit ? 'Edit Room' : 'Add Room'}</h2>

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
          {/* Name */}
          <div style={fieldStyle}>
            <label htmlFor="rm-name" style={labelStyle}>Room Name *</label>
            <input
              id="rm-name"
              type="text"
              placeholder="e.g. Conference Room A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {/* Building */}
          <div style={fieldStyle}>
            <label htmlFor="rm-building" style={labelStyle}>Building *</label>
            <input
              id="rm-building"
              type="text"
              placeholder="e.g. Block A"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {/* Floor & Capacity */}
          <div style={rowStyle}>
            <div>
              <label htmlFor="rm-floor" style={labelStyle}>Floor *</label>
              <input
                id="rm-floor"
                type="number"
                placeholder="1"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label htmlFor="rm-capacity" style={labelStyle}>Capacity *</label>
              <input
                id="rm-capacity"
                type="number"
                placeholder="10"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Status */}
          <div style={fieldStyle}>
            <label htmlFor="rm-status" style={labelStyle}>Status</label>
            <select
              id="rm-status"
              value={roomStatus}
              onChange={(e) => setRoomStatus(e.target.value)}
              style={{ ...inputStyle }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Amenities */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Amenities</label>
            <div style={amenityGridStyle}>
              {AMENITY_OPTIONS.map((opt) => (
                <span
                  key={opt.value}
                  role="checkbox"
                  aria-checked={amenities.includes(opt.value)}
                  tabIndex={0}
                  style={amenityChipStyle(amenities.includes(opt.value))}
                  onClick={() => toggleAmenity(opt.value)}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggleAmenity(opt.value); }}
                >
                  {opt.label}
                </span>
              ))}
            </div>
          </div>

          <div style={buttonRow}>
            <button type="button" style={cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={primaryBtn} disabled={isSubmitting}>
              {isSubmitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Add Room')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;

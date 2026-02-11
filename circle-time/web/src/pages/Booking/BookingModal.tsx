'use client';

import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/theme';
import type { Room } from '../../types/room';
import type { BookingRequest } from '../../types/booking';
import { validateBooking, createBooking } from '../../services/bookings';

interface BookingModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  room,
  isOpen,
  onClose,
  onBookingComplete,
}) => {
  const [formData, setFormData] = useState<BookingRequest>({
    roomId: room.id,
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    attendeeIds: [],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing.lg,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.lg,
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.border}`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  };

  const closeButtonStyle: React.CSSProperties = {
    padding: spacing.xs,
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.textMuted,
    cursor: 'pointer',
    borderRadius: borderRadius.sm,
  };

  const bodyStyle: React.CSSProperties = {
    padding: spacing.lg,
  };

  const roomInfoStyle: React.CSSProperties = {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  };

  const roomNameStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const roomMetaStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  };

  const formGroupStyle: React.CSSProperties = {
    marginBottom: spacing.lg,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    outline: 'none',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical',
  };

  const timeRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.md,
  };

  const errorBoxStyle: React.CSSProperties = {
    backgroundColor: colors.errorLight,
    border: `1px solid ${colors.error}`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  };

  const errorTextStyle: React.CSSProperties = {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    margin: 0,
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.md,
    padding: spacing.lg,
    borderTop: `1px solid ${colors.border}`,
  };

  const cancelButtonStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    cursor: 'pointer',
  };

  const submitButtonStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.background,
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    opacity: isSubmitting ? 0.7 : 1,
  };

  const handleInputChange = (field: keyof BookingRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateBooking(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await createBooking(formData);
      if (onBookingComplete) {
        onBookingComplete();
      }
      onClose();
    } catch {
      setErrors(['Failed to create booking. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Book Room</h2>
          <button type="button" style={closeButtonStyle} onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={bodyStyle}>
          <div style={roomInfoStyle}>
            <p style={roomNameStyle}>{room.name}</p>
            <p style={roomMetaStyle}>
              {room.building} · Floor {room.floor} · Capacity: {room.capacity}
            </p>
          </div>

          {errors.length > 0 && (
            <div style={errorBoxStyle}>
              {errors.map((error, index) => (
                <p key={index} style={errorTextStyle}>
                  {error}
                </p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="title">
                Meeting Title *
              </label>
              <input
                id="title"
                type="text"
                style={inputStyle}
                placeholder="e.g., Sprint Planning"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                style={textareaStyle}
                placeholder="Optional meeting description..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                style={inputStyle}
                onChange={(e) => {
                  const date = e.target.value;
                  const startTimePart = formData.startTime.split('T')[1] || '09:00';
                  const endTimePart = formData.endTime.split('T')[1] || '10:00';
                  handleInputChange('startTime', `${date}T${startTimePart}`);
                  // handleInputChange clears errors each call, so call it for endTime separately
                  setFormData((prev) => ({ ...prev, endTime: `${date}T${endTimePart}` }));
                }}
              />
            </div>

            <div style={timeRowStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="startTime">
                  Start Time *
                </label>
                <input
                  id="startTime"
                  type="time"
                  style={inputStyle}
                  value={formData.startTime.split('T')[1] || ''}
                  onChange={(e) => {
                    const date = formData.startTime.split('T')[0] || new Date().toISOString().split('T')[0];
                    handleInputChange('startTime', `${date}T${e.target.value}`);
                  }}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="endTime">
                  End Time *
                </label>
                <input
                  id="endTime"
                  type="time"
                  style={inputStyle}
                  value={formData.endTime.split('T')[1] || ''}
                  onChange={(e) => {
                    const date = formData.endTime.split('T')[0] || new Date().toISOString().split('T')[0];
                    handleInputChange('endTime', `${date}T${e.target.value}`);
                  }}
                />
              </div>
            </div>
          </form>
        </div>

        <div style={footerStyle}>
          <button type="button" style={cancelButtonStyle} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            style={submitButtonStyle}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

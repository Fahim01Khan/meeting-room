'use client';

import React, { useState } from 'react';
import type { Room } from '../../types/room';
import type { BookingRequest } from '../../types/booking';
import { validateBooking, createBooking } from '../../services/bookings';
import styles from './BookingModal.module.css';

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
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Book Room</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.roomInfo}>
            <p className={styles.roomName}>{room.name}</p>
            <p className={styles.roomMeta}>
              {room.building} · Floor {room.floor} · Capacity: {room.capacity}
            </p>
          </div>

          {errors.length > 0 && (
            <div className={styles.errorBox}>
              {errors.map((error, index) => (
                <p key={index} className={styles.errorText}>
                  {error}
                </p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="title">
                Meeting Title *
              </label>
              <input
                id="title"
                type="text"
                className={styles.input}
                placeholder="e.g., Sprint Planning"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className={styles.textarea}
                placeholder="Optional meeting description..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Date</label>
              <input
                type="date"
                className={styles.input}
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

            <div className={styles.timeRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="startTime">
                  Start Time *
                </label>
                <input
                  id="startTime"
                  type="time"
                  className={styles.input}
                  value={formData.startTime.split('T')[1] || ''}
                  onChange={(e) => {
                    const date = formData.startTime.split('T')[0] || new Date().toISOString().split('T')[0];
                    handleInputChange('startTime', `${date}T${e.target.value}`);
                  }}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="endTime">
                  End Time *
                </label>
                <input
                  id="endTime"
                  type="time"
                  className={styles.input}
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

        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={`${styles.submitButton} ${isSubmitting ? styles.submitting : ''}`}
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

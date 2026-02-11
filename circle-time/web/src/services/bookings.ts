// Booking-related API services

import { apiClient } from './api';
import type { Booking, BookingRequest, BookingValidation, TimeSlot } from '../types/booking';

export const fetchBookings = async (): Promise<Booking[]> => {
  // No single "list all" endpoint – return empty (use fetchBookingsByRoom)
  return [];
};

export const fetchBookingById = async (bookingId: string): Promise<Booking | null> => {
  try {
    const res = await apiClient.get<Booking>(`/bookings/${bookingId}`);
    return res.data ?? null;
  } catch {
    return null;
  }
};

export const fetchBookingsByRoom = async (roomId: string, date: string): Promise<Booking[]> => {
  const res = await apiClient.get<Booking[]>(`/rooms/${roomId}/bookings?date=${date}`);
  return res.data;
};

export const fetchBookingsByUser = async (_userId: string): Promise<Booking[]> => {
  // Backend does not yet expose a per-user bookings endpoint
  return [];
};

export const createBooking = async (request: BookingRequest): Promise<Booking | null> => {
  const res = await apiClient.post<Booking>('/bookings', request);
  return res.data ?? null;
};

export const updateBooking = async (
  bookingId: string,
  updates: Partial<BookingRequest>,
): Promise<Booking | null> => {
  const res = await apiClient.put<Booking>(`/bookings/${bookingId}`, updates);
  return res.data ?? null;
};

export const cancelBooking = async (bookingId: string): Promise<boolean> => {
  await apiClient.delete(`/bookings/${bookingId}`);
  return true;
};

export const checkInBooking = async (bookingId: string): Promise<boolean> => {
  await apiClient.post(`/bookings/${bookingId}/checkin`);
  return true;
};

export const endBookingEarly = async (bookingId: string): Promise<boolean> => {
  await apiClient.post(`/bookings/${bookingId}/end`);
  return true;
};

export const validateBooking = (request: BookingRequest): BookingValidation => {
  const errors: string[] = [];

  if (!request.title) {
    errors.push('Meeting title is required');
  }

  if (!request.roomId) {
    errors.push('Room selection is required');
  }

  if (!request.startTime || !request.endTime) {
    errors.push('Start and end times are required');
  }

  if (request.startTime && request.endTime && request.startTime >= request.endTime) {
    errors.push('End time must be after start time');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const fetchAvailableTimeSlots = async (
  roomId: string,
  date: string,
): Promise<TimeSlot[]> => {
  const res = await apiClient.get<TimeSlot[]>(`/rooms/${roomId}/availability?date=${date}`);
  return res.data;
};

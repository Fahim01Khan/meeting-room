// User & invitation management API service

import { apiClient } from "./api";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  dateJoined: string;
}

export interface InvitationRecord {
  id: string;
  email: string;
  role: string;
  department: string | null;
  status: "pending" | "accepted" | "expired";
  invitedBy: string | null;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

export interface InvitePayload {
  email: string;
  role: string;
  department?: string;
}

export interface InviteResult {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

export interface TokenValidation {
  email: string;
  role: string;
  valid: boolean;
}

export interface AcceptInvitePayload {
  token: string;
  name: string;
  password: string;
}

export interface AcceptInviteResult {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const fetchUsers = async (): Promise<UserRecord[]> => {
  const res = await apiClient.get<UserRecord[]>("/auth/users");
  return res.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/auth/users/${userId}`);
};

export const fetchInvitations = async (): Promise<InvitationRecord[]> => {
  const res = await apiClient.get<InvitationRecord[]>("/auth/invites");
  return res.data;
};

export const sendInvitation = async (
  data: InvitePayload,
): Promise<InviteResult> => {
  const res = await apiClient.post<InviteResult>("/auth/invite", data);
  return res.data;
};

export const cancelInvitation = async (id: string): Promise<void> => {
  await apiClient.delete(`/auth/invites/${id}`);
};

export const validateInviteToken = async (
  token: string,
): Promise<TokenValidation> => {
  const res = await apiClient.get<TokenValidation>(
    `/auth/invite/validate?token=${encodeURIComponent(token)}`,
  );
  return res.data;
};

export const acceptInvite = async (
  data: AcceptInvitePayload,
): Promise<AcceptInviteResult> => {
  const res = await apiClient.post<AcceptInviteResult>(
    "/auth/accept-invite",
    data,
  );
  return res.data;
};

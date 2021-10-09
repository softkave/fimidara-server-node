export enum CollaborationRequestStatusType {
  Accepted = 'accepted',
  Declined = 'declined',
  Revoked = 'revoked',
  Pending = 'pending',
}

export type CollaborationRequestResponse =
  | CollaborationRequestStatusType.Accepted
  | CollaborationRequestStatusType.Declined;

export interface ICollaborationRequestStatus {
  status: CollaborationRequestStatusType;
  date: string;
}

export enum CollaborationRequestEmailReason {
  RequestNotification = 'request-notification',
  RequestRevoked = 'request-revoked',
  RequestUpdated = 'request-updated',
}

export interface ICollaborationRequestSentEmailHistoryItem {
  date: string;
  reason: CollaborationRequestEmailReason;
}

export interface ICollaborationRequest {
  requestId: string;
  recipientEmail: string;
  message: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  organizationId: string;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
  readAt?: string;
  statusHistory?: ICollaborationRequestStatus[];
  sentEmailHistory?: ICollaborationRequestSentEmailHistoryItem[];
}

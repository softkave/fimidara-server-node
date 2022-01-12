import {IAgent} from './system';

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
  resourceId: string;
  recipientEmail: string;

  // TODO: should we keep messages sent back and forth?
  // TODO: should we allow users to send new messages?
  message: string;
  createdBy: IAgent;
  createdAt: string;
  expiresAt?: string;
  organizationId: string;
  lastUpdatedAt?: string;
  lastUpdatedBy?: IAgent;
  readAt?: string;
  statusHistory: ICollaborationRequestStatus[];
  sentEmailHistory: ICollaborationRequestSentEmailHistoryItem[];
}

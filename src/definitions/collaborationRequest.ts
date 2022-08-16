import {IAssignedPermissionGroup} from './permissionGroups';
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
  date: Date | string;
}

export enum CollaborationRequestEmailReason {
  RequestNotification = 'request-notification',
  RequestRevoked = 'request-revoked',
  RequestUpdated = 'request-updated',
}

export interface ICollaborationRequestSentEmailHistoryItem {
  date: Date | string;
  reason: CollaborationRequestEmailReason;
}

export interface ICollaborationRequest {
  resourceId: string;
  recipientEmail: string;
  message: string;
  createdBy: IAgent;
  createdAt: Date | string;
  expiresAt?: string;
  workspaceName: string;
  workspaceId: string;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  readAt?: Date | string;
  statusHistory: ICollaborationRequestStatus[];
}

export interface IPublicCollaborationRequest extends ICollaborationRequest {
  permissionGroupsOnAccept: IAssignedPermissionGroup[];
}

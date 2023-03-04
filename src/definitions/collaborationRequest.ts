import {IPublicAssignedPermissionGroupMeta} from './permissionGroups';
import {ConvertAgentToPublicAgent, IPublicResourceBase, IWorkspaceResourceBase} from './system';

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
  date: number;
}

export enum CollaborationRequestEmailReason {
  RequestNotification = 'request-notification',
  RequestRevoked = 'request-revoked',
  RequestUpdated = 'request-updated',
}

export interface ICollaborationRequestSentEmailHistoryItem {
  date: number;
  reason: CollaborationRequestEmailReason;
}

export interface ICollaborationRequest extends IWorkspaceResourceBase {
  recipientEmail: string;
  message: string;
  expiresAt?: number;
  workspaceName: string;
  readAt?: number;
  status: CollaborationRequestStatusType;
  statusDate: number;
}

export type IPublicCollaborationRequestForUser = Pick<
  IPublicResourceBase,
  'resourceId' | 'createdAt' | 'lastUpdatedAt'
> &
  Pick<
    ICollaborationRequest,
    | 'message'
    | 'expiresAt'
    | 'readAt'
    | 'recipientEmail'
    | 'status'
    | 'statusDate'
    | 'workspaceName'
  >;

export type IPublicCollaborationRequestForWorkspace =
  ConvertAgentToPublicAgent<ICollaborationRequest> & {
    permissionGroupsAssignedOnAcceptingRequest: IPublicAssignedPermissionGroupMeta[];
  };

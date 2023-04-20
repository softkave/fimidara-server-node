import {ConvertAgentToPublicAgent, PublicResource, WorkspaceResource} from './system';

export enum CollaborationRequestStatusType {
  Accepted = 'accepted',
  Declined = 'declined',
  Revoked = 'revoked',
  Pending = 'pending',
}

export type CollaborationRequestResponse =
  | CollaborationRequestStatusType.Accepted
  | CollaborationRequestStatusType.Declined;

export interface CollaborationRequest extends WorkspaceResource {
  recipientEmail: string;
  message: string;
  expiresAt?: number;
  workspaceName: string;
  readAt?: number;
  status: CollaborationRequestStatusType;
  statusDate: number;
}

export type PublicCollaborationRequestForUser = PublicResource &
  Pick<
    CollaborationRequest,
    | 'message'
    | 'expiresAt'
    | 'readAt'
    | 'recipientEmail'
    | 'status'
    | 'statusDate'
    | 'workspaceName'
  >;

export type PublicCollaborationRequestForWorkspace =
  ConvertAgentToPublicAgent<CollaborationRequest>;

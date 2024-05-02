import {ValueOf} from 'type-fest';
import {PublicResource, ToPublicDefinitions, WorkspaceResource} from './system.js';

export const kCollaborationRequestStatusTypeMap = {
  Accepted: 'accepted',
  Declined: 'declined',
  Revoked: 'revoked',
  Pending: 'pending',
} as const;

export type CollaborationRequestStatusType = ValueOf<
  typeof kCollaborationRequestStatusTypeMap
>;

export type CollaborationRequestResponse =
  | typeof kCollaborationRequestStatusTypeMap.Accepted
  | typeof kCollaborationRequestStatusTypeMap.Declined;

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
  ToPublicDefinitions<CollaborationRequest>;

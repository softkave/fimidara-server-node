import {ObjectValues} from '../utils/types';
import {ConvertAgentToPublicAgent, PublicResource, WorkspaceResource} from './system';

export const CollaborationRequestStatusTypeMap = {
  Accepted: 'accepted',
  Declined: 'declined',
  Revoked: 'revoked',
  Pending: 'pending',
} as const;

export type CollaborationRequestStatusType = ObjectValues<
  typeof CollaborationRequestStatusTypeMap
>;

export type CollaborationRequestResponse =
  | typeof CollaborationRequestStatusTypeMap.Accepted
  | typeof CollaborationRequestStatusTypeMap.Declined;

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

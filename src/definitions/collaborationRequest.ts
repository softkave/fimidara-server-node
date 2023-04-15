import {ConvertAgentToPublicAgent, IPublicResource, IWorkspaceResource} from './system';

export enum CollaborationRequestStatusType {
  Accepted = 'accepted',
  Declined = 'declined',
  Revoked = 'revoked',
  Pending = 'pending',
}

export type CollaborationRequestResponse =
  | CollaborationRequestStatusType.Accepted
  | CollaborationRequestStatusType.Declined;

export interface ICollaborationRequest extends IWorkspaceResource {
  recipientEmail: string;
  message: string;
  expiresAt?: number;
  workspaceName: string;
  readAt?: number;
  status: CollaborationRequestStatusType;
  statusDate: number;
}

export type IPublicCollaborationRequestForUser = IPublicResource &
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
  ConvertAgentToPublicAgent<ICollaborationRequest>;

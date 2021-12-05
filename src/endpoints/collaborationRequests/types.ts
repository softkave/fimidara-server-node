import {
  ICollaborationRequestStatus,
  ICollaborationRequestSentEmailHistoryItem,
} from '../../definitions/collaborationRequest';
import {IAgent} from '../../definitions/system';

export interface IPublicCollaborationRequest {
  requestId: string;
  recipientEmail: string;
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

import {
    ICollaborationRequestStatus,
    ICollaborationRequestSentEmailHistoryItem,
} from '../../definitions/collaborationRequest';

export interface IPublicCollaborationRequest {
    requestId: string;
    recipientEmail: string;
    message: string;
    createdBy: string;
    createdAt: string;
    expiresAt?: string;
    organizationId: string;
    organizationName: string;
    lastUpdatedAt: string;
    lastUpdatedBy: string;
    readAt?: string;
    statusHistory?: ICollaborationRequestStatus[];
    sentEmailHistory?: ICollaborationRequestSentEmailHistoryItem[];
}

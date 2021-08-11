import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicCollaborationRequest} from '../types';

export interface ICollaborationRequestInput {
    recipientEmail: string;
    message: string;
    expiresAt?: number;
}

export interface ISendRequestsParams {
    organizationId: string;
    requests: ICollaborationRequestInput[];
}

export interface ISendRequestsResult {
    requests: IPublicCollaborationRequest[];
}

export interface ISendRequestsContext extends IBaseContext {
    sendRequestEmail: (
        ctx: IBaseContext,
        request: ICollaborationRequest,
        isRecipientAUser: boolean,
        organizationName: string
    ) => Promise<void>;
}

export type SendRequestsEndpoint = Endpoint<
    ISendRequestsContext,
    ISendRequestsParams,
    ISendRequestsResult
>;

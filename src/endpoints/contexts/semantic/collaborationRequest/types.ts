import {CollaborationRequest} from '../../../../definitions/collaborationRequest';
import {DataProviderQueryListParams} from '../../data/types';
import {
  SemanticProviderTxnOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticCollaborationRequestProvider
  extends SemanticWorkspaceResourceProviderType<CollaborationRequest> {
  getManyByEmail(
    email: string,
    options?: DataProviderQueryListParams<CollaborationRequest> &
      SemanticProviderTxnOptions
  ): Promise<CollaborationRequest[]>;
  getOneByEmail(
    email: string,
    opts?: SemanticProviderTxnOptions
  ): Promise<CollaborationRequest | null>;
  getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: SemanticProviderTxnOptions
  ): Promise<CollaborationRequest | null>;
  countByEmail(email: string, opts?: SemanticProviderTxnOptions): Promise<number>;
}

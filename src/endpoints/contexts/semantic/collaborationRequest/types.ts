import {CollaborationRequest} from '../../../../definitions/collaborationRequest';
import {DataProviderQueryListParams} from '../../data/types';
import {
  SemanticProviderRunOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticCollaborationRequestProvider
  extends SemanticWorkspaceResourceProviderType<CollaborationRequest> {
  getManyByEmail(
    email: string,
    options?: DataProviderQueryListParams<CollaborationRequest> &
      SemanticProviderRunOptions
  ): Promise<CollaborationRequest[]>;
  getOneByEmail(
    email: string,
    opts?: SemanticProviderRunOptions
  ): Promise<CollaborationRequest | null>;
  getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: SemanticProviderRunOptions
  ): Promise<CollaborationRequest | null>;
  countByEmail(email: string, opts?: SemanticProviderRunOptions): Promise<number>;
}

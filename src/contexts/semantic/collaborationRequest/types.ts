import {CollaborationRequest} from '../../../definitions/collaborationRequest.js';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types.js';

export interface SemanticCollaborationRequestProvider
  extends SemanticWorkspaceResourceProviderType<CollaborationRequest> {
  getManyByEmail(
    email: string,
    options?: SemanticProviderQueryListParams<CollaborationRequest>
  ): Promise<CollaborationRequest[]>;
  getOneByEmail(
    email: string,
    opts?: SemanticProviderQueryParams<CollaborationRequest>
  ): Promise<CollaborationRequest | null>;
  getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: SemanticProviderQueryParams<CollaborationRequest>
  ): Promise<CollaborationRequest | null>;
  countByEmail(email: string, opts?: SemanticProviderOpParams): Promise<number>;
}

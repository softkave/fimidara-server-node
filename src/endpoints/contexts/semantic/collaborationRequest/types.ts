import {CollaborationRequest} from '../../../../definitions/collaborationRequest';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  SemanticDataAccessProviderRunOptions,
  SemanticDataAccessWorkspaceResourceProviderType,
} from '../types';

export interface SemanticDataAccessCollaborationRequestProvider
  extends SemanticDataAccessWorkspaceResourceProviderType<CollaborationRequest> {
  getManyByEmail(
    email: string,
    options?: IDataProvideQueryListParams<CollaborationRequest> &
      SemanticDataAccessProviderRunOptions
  ): Promise<CollaborationRequest[]>;
  getOneByEmail(
    email: string,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<CollaborationRequest | null>;
  getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<CollaborationRequest | null>;
  countByEmail(email: string, opts?: SemanticDataAccessProviderRunOptions): Promise<number>;
}

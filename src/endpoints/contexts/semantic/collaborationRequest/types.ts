import {CollaborationRequest} from '../../../../definitions/collaborationRequest';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessCollaborationRequestProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<CollaborationRequest> {
  getManyByEmail(
    email: string,
    options?: IDataProvideQueryListParams<CollaborationRequest> &
      ISemanticDataAccessProviderRunOptions
  ): Promise<CollaborationRequest[]>;
  getOneByEmail(
    email: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<CollaborationRequest | null>;
  getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<CollaborationRequest | null>;
  countByEmail(email: string, opts?: ISemanticDataAccessProviderRunOptions): Promise<number>;
}

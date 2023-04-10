import {ICollaborationRequest} from '../../../../definitions/collaborationRequest';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessCollaborationRequestProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<ICollaborationRequest> {
  getManyByEmail(
    email: string,
    options?: IDataProvideQueryListParams<ICollaborationRequest> &
      ISemanticDataAccessProviderRunOptions
  ): Promise<ICollaborationRequest[]>;
  getOneByEmail(
    email: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<ICollaborationRequest | null>;
  getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<ICollaborationRequest | null>;
  countByEmail(email: string, opts?: ISemanticDataAccessProviderRunOptions): Promise<number>;
}

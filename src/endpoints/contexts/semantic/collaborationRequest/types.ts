import {ICollaborationRequest} from '../../../../definitions/collaborationRequest';
import {IDataProvideQueryListParams} from '../../data/types';
import {ISemanticDataAccessWorkspaceResourceProvider} from '../types';

export interface ISemanticDataAccessCollaborationRequestProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<ICollaborationRequest> {
  getManyByEmail(
    email: string,
    options?: IDataProvideQueryListParams<ICollaborationRequest>
  ): Promise<ICollaborationRequest[]>;
  getOneByEmail(email: string): Promise<ICollaborationRequest | null>;
  getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string
  ): Promise<ICollaborationRequest | null>;
  countByEmail(email: string): Promise<number>;
}

import {ICollaborationRequest} from '../../../../definitions/collaborationRequest';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {IDataProvideQueryListParams} from '../../data/types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessCollaborationRequestProvider} from './types';

export class MemorySemanticDataAccessCollaborationRequest
  extends SemanticDataAccessWorkspaceResourceProvider<ICollaborationRequest>
  implements ISemanticDataAccessCollaborationRequestProvider
{
  async countByEmail(email: string): Promise<number> {
    throw reuseableErrors.common.notImplemented();
  }

  async getOneByEmail(email: string): Promise<ICollaborationRequest | null> {
    throw reuseableErrors.common.notImplemented();
  }

  async getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string
  ): Promise<ICollaborationRequest | null> {
    throw reuseableErrors.common.notImplemented();
  }

  async getManyByEmail(
    email: string,
    options?: IDataProvideQueryListParams<ICollaborationRequest> | undefined
  ): Promise<ICollaborationRequest[]> {
    throw reuseableErrors.common.notImplemented();
  }
}

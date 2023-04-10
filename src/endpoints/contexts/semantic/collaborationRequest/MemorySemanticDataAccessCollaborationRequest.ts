import {ICollaborationRequest} from '../../../../definitions/collaborationRequest';
import {IDataProvideQueryListParams} from '../../data/types';
import {ISemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessCollaborationRequestProvider} from './types';

export class MemorySemanticDataAccessCollaborationRequest
  extends SemanticDataAccessWorkspaceResourceProvider<ICollaborationRequest>
  implements ISemanticDataAccessCollaborationRequestProvider
{
  async countByEmail(
    email: string,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    return await this.memstore.countItems(
      {recipientEmail: {$lowercaseEq: email}},
      opts?.transaction
    );
  }

  async getOneByEmail(
    email: string,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<ICollaborationRequest | null> {
    return await this.memstore.readItem({recipientEmail: {$lowercaseEq: email}}, opts?.transaction);
  }

  async getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<ICollaborationRequest | null> {
    return await this.memstore.readItem(
      {workspaceId, recipientEmail: {$lowercaseEq: email}},
      opts?.transaction
    );
  }

  async getManyByEmail(
    email: string,
    options?:
      | (IDataProvideQueryListParams<ICollaborationRequest> & ISemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<ICollaborationRequest[]> {
    return await this.memstore.readManyItems(
      {recipientEmail: {$lowercaseEq: email}},
      options?.transaction,
      options?.pageSize,
      options?.page
    );
  }
}

import {CollaborationRequest} from '../../../../definitions/collaborationRequest';
import {IDataProvideQueryListParams} from '../../data/types';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessCollaborationRequestProvider} from './types';

export class MemorySemanticDataAccessCollaborationRequest
  extends SemanticDataAccessWorkspaceResourceProvider<CollaborationRequest>
  implements SemanticDataAccessCollaborationRequestProvider
{
  async countByEmail(
    email: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    return await this.memstore.countItems(
      {recipientEmail: {$lowercaseEq: email}},
      opts?.transaction
    );
  }

  async getOneByEmail(
    email: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<CollaborationRequest | null> {
    return await this.memstore.readItem({recipientEmail: {$lowercaseEq: email}}, opts?.transaction);
  }

  async getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<CollaborationRequest | null> {
    return await this.memstore.readItem(
      {workspaceId, recipientEmail: {$lowercaseEq: email}},
      opts?.transaction
    );
  }

  async getManyByEmail(
    email: string,
    options?:
      | (IDataProvideQueryListParams<CollaborationRequest> & SemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<CollaborationRequest[]> {
    return await this.memstore.readManyItems(
      {recipientEmail: {$lowercaseEq: email}},
      options?.transaction,
      options?.pageSize,
      options?.page
    );
  }
}

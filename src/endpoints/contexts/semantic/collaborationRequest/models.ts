import {CollaborationRequest} from '../../../../definitions/collaborationRequest';
import {getLowercaseRegExpForString} from '../../../../utils/fns';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessCollaborationRequestProvider} from './types';

export class DataSemanticDataAccessCollaborationRequest
  extends DataSemanticDataAccessWorkspaceResourceProvider<CollaborationRequest>
  implements SemanticDataAccessCollaborationRequestProvider
{
  async countByEmail(
    email: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    return await this.data.countByQuery(
      {recipientEmail: {$regex: getLowercaseRegExpForString(email)}},
      opts
    );
  }

  async getOneByEmail(
    email: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<CollaborationRequest | null> {
    return await this.data.getOneByQuery(
      {recipientEmail: {$regex: getLowercaseRegExpForString(email)}},
      opts
    );
  }

  async getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<CollaborationRequest | null> {
    return await this.data.getOneByQuery(
      {workspaceId, recipientEmail: {$regex: getLowercaseRegExpForString(email)}},
      opts
    );
  }

  async getManyByEmail(
    email: string,
    options?:
      | (DataProviderQueryListParams<CollaborationRequest> & SemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<CollaborationRequest[]> {
    return await this.data.getManyByQuery(
      {recipientEmail: {$regex: getLowercaseRegExpForString(email)}},
      options
    );
  }
}

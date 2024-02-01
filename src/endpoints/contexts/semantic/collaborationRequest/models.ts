import {CollaborationRequest} from '../../../../definitions/collaborationRequest';
import {getIgnoreCaseRegExpForString} from '../../../../utils/fns';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderRunOptions} from '../types';
import {SemanticCollaborationRequestProvider} from './types';

export class DataSemanticCollaborationRequest
  extends DataSemanticWorkspaceResourceProvider<CollaborationRequest>
  implements SemanticCollaborationRequestProvider
{
  async countByEmail(
    email: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<number> {
    return await this.data.countByQuery(
      {recipientEmail: {$regex: getIgnoreCaseRegExpForString(email)}},
      opts
    );
  }

  async getOneByEmail(
    email: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<CollaborationRequest | null> {
    return await this.data.getOneByQuery(
      {recipientEmail: {$regex: getIgnoreCaseRegExpForString(email)}},
      opts
    );
  }

  async getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<CollaborationRequest | null> {
    return await this.data.getOneByQuery(
      {workspaceId, recipientEmail: {$regex: getIgnoreCaseRegExpForString(email)}},
      opts
    );
  }

  async getManyByEmail(
    email: string,
    options?:
      | (DataProviderQueryListParams<CollaborationRequest> & SemanticProviderRunOptions)
      | undefined
  ): Promise<CollaborationRequest[]> {
    return await this.data.getManyByQuery(
      {recipientEmail: {$regex: getIgnoreCaseRegExpForString(email)}},
      options
    );
  }
}

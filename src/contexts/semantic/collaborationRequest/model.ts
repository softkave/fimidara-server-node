import {CollaborationRequest} from '../../../definitions/collaborationRequest.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
} from '../types.js';
import {getIgnoreCaseDataQueryRegExp} from '../utils.js';
import {SemanticCollaborationRequestProvider} from './types.js';

export class DataSemanticCollaborationRequest
  extends SemanticWorkspaceResourceProvider<CollaborationRequest>
  implements SemanticCollaborationRequestProvider
{
  async countByEmail(
    email: string,
    opts?: SemanticProviderOpParams | undefined
  ): Promise<number> {
    const query = addIsDeletedIntoQuery<DataQuery<CollaborationRequest>>(
      {recipientEmail: getIgnoreCaseDataQueryRegExp(email)},
      opts?.includeDeleted || false
    );
    return await this.data.countByQuery(query, opts);
  }

  async getOneByEmail(
    email: string,
    opts?: SemanticProviderQueryParams<CollaborationRequest> | undefined
  ): Promise<CollaborationRequest | null> {
    const query = addIsDeletedIntoQuery<DataQuery<CollaborationRequest>>(
      {recipientEmail: getIgnoreCaseDataQueryRegExp(email)},
      opts?.includeDeleted || false
    );
    return await this.data.getOneByQuery(query, opts);
  }

  async getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: SemanticProviderQueryParams<CollaborationRequest> | undefined
  ): Promise<CollaborationRequest | null> {
    const query = addIsDeletedIntoQuery<DataQuery<CollaborationRequest>>(
      {workspaceId, recipientEmail: getIgnoreCaseDataQueryRegExp(email)},
      opts?.includeDeleted || false
    );
    return await this.data.getOneByQuery(query, opts);
  }

  async getManyByEmail(
    email: string,
    options?: SemanticProviderQueryListParams<CollaborationRequest> | undefined
  ): Promise<CollaborationRequest[]> {
    const query = addIsDeletedIntoQuery<DataQuery<CollaborationRequest>>(
      {recipientEmail: getIgnoreCaseDataQueryRegExp(email)},
      options?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, options);
  }
}

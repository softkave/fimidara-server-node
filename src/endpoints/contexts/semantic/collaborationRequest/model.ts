import {CollaborationRequest} from '../../../../definitions/collaborationRequest';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderTxnOptions} from '../types';
import {getIgnoreCaseDataQueryRegExp} from '../utils';
import {SemanticCollaborationRequestProvider} from './types';

export class DataSemanticCollaborationRequest
  extends DataSemanticWorkspaceResourceProvider<CollaborationRequest>
  implements SemanticCollaborationRequestProvider
{
  async countByEmail(
    email: string,
    opts?: SemanticProviderTxnOptions | undefined
  ): Promise<number> {
    return await this.data.countByQuery(
      {recipientEmail: getIgnoreCaseDataQueryRegExp(email)},
      opts
    );
  }

  async getOneByEmail(
    email: string,
    opts?: SemanticProviderTxnOptions | undefined
  ): Promise<CollaborationRequest | null> {
    return await this.data.getOneByQuery(
      {recipientEmail: getIgnoreCaseDataQueryRegExp(email)},
      opts
    );
  }

  async getOneByWorkspaceIdEmail(
    workspaceId: string,
    email: string,
    opts?: SemanticProviderTxnOptions | undefined
  ): Promise<CollaborationRequest | null> {
    return await this.data.getOneByQuery(
      {workspaceId, recipientEmail: getIgnoreCaseDataQueryRegExp(email)},
      opts
    );
  }

  async getManyByEmail(
    email: string,
    options?:
      | (DataProviderQueryListParams<CollaborationRequest> & SemanticProviderTxnOptions)
      | undefined
  ): Promise<CollaborationRequest[]> {
    return await this.data.getManyByQuery(
      {recipientEmail: getIgnoreCaseDataQueryRegExp(email)},
      options
    );
  }
}

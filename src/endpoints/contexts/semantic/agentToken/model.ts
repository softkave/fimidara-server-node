import {AgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {kSystemSessionAgent} from '../../../../utils/agent';
import {AgentTokenQueries} from '../../../agentTokens/queries';
import {DataQuery} from '../../data/types';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderMutationParams, SemanticProviderQueryParams} from '../types';
import {SemanticAgentTokenProvider} from './types';

export class DataSemanticAgentToken
  extends DataSemanticWorkspaceResourceProvider<AgentToken>
  implements SemanticAgentTokenProvider
{
  async softDeleteAgentTokens(
    agentId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<AgentToken>>(
      AgentTokenQueries.getByEntityAndScope({forEntityId: agentId, scope: tokenScope}),
      opts?.includeDeleted || true
    );
    await this.softDeleteManyByQuery(query, kSystemSessionAgent, opts);
  }

  async getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[] | undefined,
    opts?: SemanticProviderQueryParams<AgentToken> | undefined
  ): Promise<AgentToken | null> {
    const query = addIsDeletedIntoQuery<DataQuery<AgentToken>>(
      AgentTokenQueries.getByEntityAndScope({forEntityId: agentId, scope: tokenScope}),
      opts?.includeDeleted || false
    );
    return await this.data.getOneByQuery(query, opts);
  }
}

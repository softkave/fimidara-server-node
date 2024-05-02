import {AgentToken} from '../../../../definitions/agentToken.js';
import {TokenAccessScope} from '../../../../definitions/system.js';
import {kSystemSessionAgent} from '../../../../utils/agent.js';
import {AgentTokenQueries} from '../../../agentTokens/queries.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider.js';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider.js';
import {SemanticProviderMutationParams, SemanticProviderQueryParams} from '../types.js';
import {SemanticAgentTokenProvider} from './types.js';

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

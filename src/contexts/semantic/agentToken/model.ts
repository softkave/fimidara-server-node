import {AgentToken} from '../../../definitions/agentToken.js';
import {TokenAccessScope} from '../../../definitions/system.js';
import {AgentTokenQueries} from '../../../endpoints/agentTokens/queries.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryParams,
} from '../types.js';
import {SemanticAgentTokenProvider} from './types.js';

export class DataSemanticAgentToken
  extends SemanticWorkspaceResourceProvider<AgentToken>
  implements SemanticAgentTokenProvider
{
  async softDeleteAgentTokens(
    userId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<AgentToken>>(
      AgentTokenQueries.getByEntityAndScope({
        forEntityId: userId,
        scope: tokenScope,
      }),
      opts?.includeDeleted || true
    );
    await this.softDeleteManyByQuery(query, kSystemSessionAgent, opts);
  }

  async getUserAgentToken(
    userId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[] | undefined,
    opts?: SemanticProviderQueryParams<AgentToken> | undefined
  ): Promise<AgentToken | null> {
    const query = addIsDeletedIntoQuery<DataQuery<AgentToken>>(
      AgentTokenQueries.getByEntityAndScope({
        forEntityId: userId,
        scope: tokenScope,
      }),
      opts?.includeDeleted || false
    );
    return await this.data.getOneByQuery(query, opts);
  }
}

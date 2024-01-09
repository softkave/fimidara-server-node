import {AgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {AgentTokenQueries} from '../../../agentTokens/queries';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderMutationRunOptions, SemanticProviderRunOptions} from '../types';
import {SemanticAgentTokenProvider} from './types';

export class DataSemanticAgentToken
  extends DataSemanticWorkspaceResourceProvider<AgentToken>
  implements SemanticAgentTokenProvider
{
  async deleteAgentTokens(
    agentId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(
      AgentTokenQueries.getByEntityAndScope({forEntityId: agentId, scope: tokenScope}),
      opts
    );
  }

  async getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[] | undefined,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<AgentToken | null> {
    return await this.data.getOneByQuery(
      AgentTokenQueries.getByEntityAndScope({forEntityId: agentId, scope: tokenScope}),
      opts
    );
  }
}

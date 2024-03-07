import {AgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {kSystemSessionAgent} from '../../../../utils/agent';
import {AgentTokenQueries} from '../../../agentTokens/queries';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderMutationTxnOptions, SemanticProviderTxnOptions} from '../types';
import {SemanticAgentTokenProvider} from './types';

export class DataSemanticAgentToken
  extends DataSemanticWorkspaceResourceProvider<AgentToken>
  implements SemanticAgentTokenProvider
{
  async softDeleteAgentTokens(
    agentId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    await this.softDeleteManyByQuery(
      AgentTokenQueries.getByEntityAndScope({forEntityId: agentId, scope: tokenScope}),
      kSystemSessionAgent,
      opts
    );
  }

  async getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[] | undefined,
    opts?: SemanticProviderTxnOptions | undefined
  ): Promise<AgentToken | null> {
    return await this.data.getOneByQuery(
      AgentTokenQueries.getByEntityAndScope({forEntityId: agentId, scope: tokenScope}),
      opts
    );
  }
}

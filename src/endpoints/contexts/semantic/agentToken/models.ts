import {AgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {toCompactArray} from '../../../../utils/fns';
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
      {
        forEntityId: agentId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scope: tokenScope ? {$all: toCompactArray(tokenScope) as any} : undefined,
      },
      opts
    );
  }

  async getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[] | undefined,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<AgentToken | null> {
    return await this.data.getOneByQuery(
      {
        forEntityId: agentId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scope: tokenScope ? {$all: toCompactArray(tokenScope) as any} : undefined,
      },
      opts
    );
  }
}

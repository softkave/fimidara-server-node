import {AgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {toNonNullableArray} from '../../../../utils/fns';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from '../types';
import {SemanticDataAccessAgentTokenProvider} from './types';

export class DataSemanticDataAccessAgentToken
  extends DataSemanticDataAccessWorkspaceResourceProvider<AgentToken>
  implements SemanticDataAccessAgentTokenProvider
{
  async deleteAgentTokens(
    agentId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(
      {
        separateEntityId: agentId,
        scope: tokenScope ? {$all: toNonNullableArray(tokenScope)} : undefined,
      },
      opts
    );
  }

  async getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[] | undefined,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<AgentToken | null> {
    return await this.data.getOneByQuery(
      {
        separateEntityId: agentId,
        scope: tokenScope ? {$all: toNonNullableArray(tokenScope)} : undefined,
      },
      opts
    );
  }
}

import {AgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {toNonNullableArray} from '../../../../utils/fns';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessAgentTokenProvider} from './types';

export class MemorySemanticDataAccessAgentToken
  extends SemanticDataAccessWorkspaceResourceProvider<AgentToken>
  implements SemanticDataAccessAgentTokenProvider
{
  async deleteAgentTokens(
    agentId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.memstore.deleteManyItems(
      {
        separateEntityId: agentId,
        scope: tokenScope ? {$in: toNonNullableArray(tokenScope)} : undefined,
      },
      opts?.transaction
    );
  }

  async getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[] | undefined,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<AgentToken | null> {
    return await this.memstore.readItem(
      {
        separateEntityId: agentId,
        scope: tokenScope ? {$in: toNonNullableArray(tokenScope)} : undefined,
      },
      opts?.transaction
    );
  }
}

import {AgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {toNonNullableArray} from '../../../../utils/fns';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticWorkspaceResourceProvider';
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
        separateEntityId: agentId,
        scope: tokenScope ? {$all: toNonNullableArray(tokenScope)} : undefined,
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
        separateEntityId: agentId,
        scope: tokenScope ? {$all: toNonNullableArray(tokenScope)} : undefined,
      },
      opts
    );
  }
}

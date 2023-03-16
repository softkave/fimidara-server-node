import {IAgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {toArray} from '../../../../utils/fns';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {
  ISemanticDataAccessProviderMutationRunOptions,
  ISemanticDataAccessProviderRunOptions,
} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessAgentTokenProvider} from './types';

export class MemorySemanticDataAccessAgentToken
  extends SemanticDataAccessWorkspaceResourceProvider<IAgentToken>
  implements ISemanticDataAccessAgentTokenProvider
{
  async deleteAgentTokens(
    agentId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[] | undefined,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<IAgentToken | null> {
    return await this.memstore.readItem(
      {
        separateEntityId: agentId,
        scope: tokenScope ? {$in: toArray(tokenScope)} : undefined,
      },
      opts?.transaction
    );
  }
}

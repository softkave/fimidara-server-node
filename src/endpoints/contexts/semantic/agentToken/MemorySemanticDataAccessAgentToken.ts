import {IAgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessAgentTokenProvider} from './types';

export class MemorySemanticDataAccessAgentToken
  extends SemanticDataAccessWorkspaceResourceProvider<IAgentToken>
  implements ISemanticDataAccessAgentTokenProvider
{
  async deleteAgentTokens(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[] | undefined
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[] | undefined
  ): Promise<IAgentToken | null> {
    throw reuseableErrors.common.notImplemented();
  }
}

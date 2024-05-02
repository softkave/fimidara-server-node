import {AgentToken} from '../../../../definitions/agentToken.js';
import {TokenAccessScope} from '../../../../definitions/system.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types.js';

export interface SemanticAgentTokenProvider
  extends SemanticWorkspaceResourceProviderType<AgentToken> {
  softDeleteAgentTokens(
    agentId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[],
    opts?: SemanticProviderQueryParams<AgentToken>
  ): Promise<AgentToken | null>;
}

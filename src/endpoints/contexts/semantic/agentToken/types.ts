import {AgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types';

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

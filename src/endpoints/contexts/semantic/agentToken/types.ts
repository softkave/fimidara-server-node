import {AgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
  SemanticDataAccessWorkspaceResourceProviderType,
} from '../types';

export interface SemanticDataAccessAgentTokenProvider<TTxn>
  extends SemanticDataAccessWorkspaceResourceProviderType<AgentToken, TTxn> {
  deleteAgentTokens(
    agentId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[],
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<AgentToken | null>;
}

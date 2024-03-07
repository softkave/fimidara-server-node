import {AgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {
  SemanticProviderMutationTxnOptions,
  SemanticProviderTxnOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticAgentTokenProvider
  extends SemanticWorkspaceResourceProviderType<AgentToken> {
  softDeleteAgentTokens(
    agentId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
  getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[],
    opts?: SemanticProviderTxnOptions
  ): Promise<AgentToken | null>;
}

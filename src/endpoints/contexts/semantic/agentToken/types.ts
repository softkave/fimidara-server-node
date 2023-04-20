import {AgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
  SemanticDataAccessProviderMutationRunOptions,
} from '../types';

export interface ISemanticDataAccessAgentTokenProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<AgentToken> {
  deleteAgentTokens(
    agentId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[],
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<AgentToken | null>;
}

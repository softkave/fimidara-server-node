import {IAgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {
  ISemanticDataAccessProviderMutationRunOptions,
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessAgentTokenProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IAgentToken> {
  deleteAgentTokens(
    agentId: string,
    tokenScope: TokenAccessScope | TokenAccessScope[] | undefined,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[],
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<IAgentToken | null>;
}

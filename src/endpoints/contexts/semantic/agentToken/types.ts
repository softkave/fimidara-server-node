import {IAgentToken} from '../../../../definitions/agentToken';
import {TokenAccessScope} from '../../../../definitions/system';
import {ISemanticDataAccessWorkspaceResourceProvider} from '../types';

export interface ISemanticDataAccessAgentTokenProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IAgentToken> {
  deleteAgentTokens(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[]
  ): Promise<void>;
  getOneAgentToken(
    agentId: string,
    tokenScope?: TokenAccessScope | TokenAccessScope[]
  ): Promise<IAgentToken | null>;
}

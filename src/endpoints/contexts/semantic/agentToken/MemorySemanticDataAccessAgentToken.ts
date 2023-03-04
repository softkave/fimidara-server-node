import {IAgentToken} from '../../../../definitions/agentToken';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessAgentTokenProvider} from './types';

export class MemorySemanticDataAccessAgentToken
  extends SemanticDataAccessWorkspaceResourceProvider<IAgentToken>
  implements ISemanticDataAccessAgentTokenProvider {}

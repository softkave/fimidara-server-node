import {AppResourceType, ISessionAgent} from '../definitions/system';
import {getNewIdForResource, ID_SIZE} from './resource';

export const SYSTEM_SESSION_AGENT: ISessionAgent = {
  agentId: getNewIdForResource(AppResourceType.System),
  agentType: AppResourceType.System,
  agentTokenId: getNewIdForResource(AppResourceType.AgentToken, ID_SIZE, true),
};

export const PUBLIC_SESSION_AGENT: ISessionAgent = {
  agentId: getNewIdForResource(AppResourceType.Public),
  agentType: AppResourceType.Public,
  agentTokenId: getNewIdForResource(AppResourceType.AgentToken, ID_SIZE, true),
};

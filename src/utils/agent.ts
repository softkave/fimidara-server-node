import {AppResourceType, SessionAgent} from '../definitions/system';
import {ID_SIZE, getNewIdForResource} from './resource';

export const SYSTEM_SESSION_AGENT: SessionAgent = {
  agentId: getNewIdForResource(AppResourceType.System),
  agentType: AppResourceType.System,
  agentTokenId: getNewIdForResource(
    AppResourceType.AgentToken,
    ID_SIZE,
    /** fill with zeros 000.. */ true
  ),
};

export const PUBLIC_SESSION_AGENT: SessionAgent = {
  agentId: getNewIdForResource(AppResourceType.Public),
  agentType: AppResourceType.Public,
  agentTokenId: getNewIdForResource(
    AppResourceType.AgentToken,
    ID_SIZE,
    /** fill with zeros 000.. */ true
  ),
};

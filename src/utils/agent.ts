import {AppResourceTypeMap, SessionAgent} from '../definitions/system';
import {ID_SIZE, getNewIdForResource} from './resource';

export const SYSTEM_SESSION_AGENT: SessionAgent = {
  agentId: getNewIdForResource(AppResourceTypeMap.System),
  agentType: AppResourceTypeMap.System,
  agentTokenId: getNewIdForResource(
    AppResourceTypeMap.AgentToken,
    ID_SIZE,
    /** fill with zeros 000.. */ true
  ),
};

export const PUBLIC_SESSION_AGENT: SessionAgent = {
  agentId: getNewIdForResource(AppResourceTypeMap.Public),
  agentType: AppResourceTypeMap.Public,
  agentTokenId: getNewIdForResource(
    AppResourceTypeMap.AgentToken,
    ID_SIZE,
    /** fill with zeros 000.. */ true
  ),
};

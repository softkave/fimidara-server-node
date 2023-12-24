import {kAppResourceType, SessionAgent} from '../definitions/system';
import {getNewIdForResource, ID_SIZE} from './resource';

export const SYSTEM_SESSION_AGENT: SessionAgent = {
  agentId: getNewIdForResource(kAppResourceType.System),
  agentType: kAppResourceType.System,
  agentTokenId: getNewIdForResource(
    kAppResourceType.AgentToken,
    ID_SIZE,
    /** fill with zeros 000.. */ true
  ),
};

export const PUBLIC_SESSION_AGENT: SessionAgent = {
  agentId: getNewIdForResource(kAppResourceType.Public),
  agentType: kAppResourceType.Public,
  agentTokenId: getNewIdForResource(
    kAppResourceType.AgentToken,
    ID_SIZE,
    /** fill with zeros 000.. */ true
  ),
};

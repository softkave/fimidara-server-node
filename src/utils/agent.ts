import {kAppResourceType, SessionAgent} from '../definitions/system';
import {getNewIdForResource, kIdSize} from './resource';

/** Use for actions performed by system. */
export const kSystemSessionAgent: SessionAgent = {
  agentId: getNewIdForResource(kAppResourceType.System),
  agentType: kAppResourceType.System,
  agentTokenId: getNewIdForResource(
    kAppResourceType.AgentToken,
    kIdSize,
    /** fill with zeros 000.. */ true
  ),
};

/** Use for actions performed by any unauthenticated account, particularly for
 * resources allowed public access. */
export const kPublicSessionAgent: SessionAgent = {
  agentId: getNewIdForResource(kAppResourceType.Public),
  agentType: kAppResourceType.Public,
  agentTokenId: getNewIdForResource(
    kAppResourceType.AgentToken,
    kIdSize,
    /** fill with zeros 000.. */ true
  ),
};

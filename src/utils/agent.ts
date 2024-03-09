import {kFimidaraResourceType, SessionAgent} from '../definitions/system';
import {getNewIdForResource, kIdSize} from './resource';

/** Use for actions performed by system. */
export const kSystemSessionAgent: SessionAgent = {
  agentId: getNewIdForResource(kFimidaraResourceType.System),
  agentType: kFimidaraResourceType.System,
  agentTokenId: getNewIdForResource(
    kFimidaraResourceType.AgentToken,
    kIdSize,
    /** fill with zeros 000.. */ true
  ),
};

/** Use for actions performed by any unauthenticated account, particularly for
 * resources allowed public access. */
export const kPublicSessionAgent: SessionAgent = {
  agentId: getNewIdForResource(kFimidaraResourceType.Public),
  agentType: kFimidaraResourceType.Public,
  agentTokenId: getNewIdForResource(
    kFimidaraResourceType.AgentToken,
    kIdSize,
    /** fill with zeros 000.. */ true
  ),
};

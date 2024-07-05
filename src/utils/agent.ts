import {AgentToken} from '../definitions/agentToken.js';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
  SessionAgent,
} from '../definitions/system.js';
import {
  getNewIdForResource,
  kIdSeparator,
  kIdSize,
  kResourceTypeShortNames,
  newResource,
} from './resource.js';

const kId01 = new Array(kIdSize - 1).fill(0).concat([1]).join('');
const kId02 = new Array(kIdSize - 1).fill(0).concat([2]).join('');

const kSystemAgentResourceId = getNewIdForResource(
  kFimidaraResourceType.System
);
const kPublicAgentResourceId = getNewIdForResource(
  kFimidaraResourceType.Public
);

const agentTokenShortName =
  kResourceTypeShortNames[kFimidaraResourceType.AgentToken];
const kSystemAgentTokenResourceId = `${agentTokenShortName}${kIdSeparator}${kId01}`;
const kPublicAgentTokenResourceId = `${agentTokenShortName}${kIdSeparator}${kId02}`;

const kSystemAgent = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
  providedResourceId: null,
  forEntityId: kSystemAgentResourceId,
  entityType: kFimidaraResourceType.System,
  workspaceId: null,
  version: kCurrentJWTTokenVersion,
  scope: [kTokenAccessScope.access],
  resourceId: kSystemAgentTokenResourceId,
});

const kPublicAgent = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
  providedResourceId: null,
  forEntityId: kPublicAgentResourceId,
  entityType: kFimidaraResourceType.Public,
  workspaceId: null,
  version: kCurrentJWTTokenVersion,
  scope: [kTokenAccessScope.access],
  resourceId: kPublicAgentTokenResourceId,
});

/** Use for actions performed by system. */
export const kSystemSessionAgent: SessionAgent = {
  agentId: kSystemAgentResourceId,
  agentType: kFimidaraResourceType.System,
  agentTokenId: kSystemAgentTokenResourceId,
  agentToken: kSystemAgent,
};

/** Use for actions performed by any unauthenticated account, particularly for
 * resources allowed public access. */
export const kPublicSessionAgent: SessionAgent = {
  agentId: kPublicAgentResourceId,
  agentType: kFimidaraResourceType.Public,
  agentTokenId: kPublicAgentTokenResourceId,
  agentToken: kPublicAgent,
};

import {AgentToken} from '../definitions/agentToken';
import {Agent, AppResourceType, BaseTokenData, SessionAgent} from '../definitions/system';
import {User} from '../definitions/user';
import {InvalidRequestError} from '../endpoints/errors';
import {PermissionDeniedError} from '../endpoints/users/errors';
import {appAssert} from './assertion';
import {getResourceTypeFromId} from './resource';

export function makeWorkspaceAgentTokenAgent(agentToken: AgentToken): SessionAgent {
  return {
    agentToken,
    agentId: agentToken.resourceId,
    agentType: AppResourceType.AgentToken,
    agentTokenId: agentToken.resourceId,
  };
}

export function makeUserSessionAgent(user: User, agentToken: AgentToken): SessionAgent {
  appAssert(user.resourceId === agentToken.separateEntityId);
  return {
    agentToken,
    user,
    agentId: user.resourceId,
    agentType: AppResourceType.User,
    agentTokenId: agentToken.resourceId,
  };
}

export function getWorkspaceIdNoThrow(agent: SessionAgent, providedWorkspaceId?: string) {
  const workspaceId = providedWorkspaceId
    ? providedWorkspaceId
    : agent.agentToken
    ? agent.agentToken.workspaceId
    : undefined;
  return workspaceId;
}

export function getWorkspaceIdFromSessionAgent(agent: SessionAgent, providedWorkspaceId?: string) {
  const workspaceId = getWorkspaceIdNoThrow(agent, providedWorkspaceId);
  if (!workspaceId) {
    throw new InvalidRequestError('Workspace ID not provided');
  }
  return workspaceId;
}

export function tryGetAgentTokenId(
  agent: SessionAgent,
  providedTokenId?: string | null,
  onReferenced?: boolean
) {
  const tokenId = providedTokenId
    ? providedTokenId
    : onReferenced
    ? agent.agentToken?.resourceId
    : null;
  return tokenId;
}

export function assertIncomingToken(
  incomingTokenData: BaseTokenData | undefined | null,
  type: AppResourceType
): incomingTokenData is BaseTokenData {
  if (!incomingTokenData) {
    throw new PermissionDeniedError();
  }
  if (getResourceTypeFromId(incomingTokenData.sub.id) !== type) {
    throw new PermissionDeniedError();
  }
  return true;
}

export function assertGetWorkspaceIdFromAgent(agent: SessionAgent) {
  const workspaceId = agent.agentToken ? agent.agentToken.workspaceId : null;
  if (!workspaceId) {
    throw new InvalidRequestError('Workspace ID not provided');
  }

  return workspaceId;
}

export function getActionAgentFromSessionAgent(sessionAgent: SessionAgent): Agent {
  const agent: Agent = {
    agentId: sessionAgent.agentId,
    agentType: sessionAgent.agentType,
    agentTokenId: sessionAgent.agentTokenId,
  };
  return agent;
}

export function isSessionAgent(agent: any): agent is SessionAgent {
  if (!(agent as SessionAgent).agentId || !(agent as SessionAgent).agentType) return false;
  if (
    (agent as SessionAgent).agentToken ||
    (agent as SessionAgent).user ||
    (agent as SessionAgent).agentType === AppResourceType.System ||
    (agent as SessionAgent).agentType === AppResourceType.Public
  )
    return true;

  return false;
}

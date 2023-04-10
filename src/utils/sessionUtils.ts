import {IAgentToken} from '../definitions/agentToken';
import {AppResourceType, IAgent, IBaseTokenData, ISessionAgent} from '../definitions/system';
import {IUser} from '../definitions/user';
import {InvalidRequestError} from '../endpoints/errors';
import {PermissionDeniedError} from '../endpoints/user/errors';
import {getResourceTypeFromId} from './resource';

export function makeAgentTokenAgent(agentToken: IAgentToken): ISessionAgent {
  return {
    agentToken,
    agentId: agentToken.resourceId,
    agentType: AppResourceType.AgentToken,
    agentTokenId: agentToken.resourceId,
  };
}

export function makeUserSessionAgent(user: IUser, agentToken: IAgentToken): ISessionAgent {
  return {
    agentToken,
    user,
    agentId: user.resourceId,
    agentType: AppResourceType.User,
    agentTokenId: agentToken.resourceId,
  };
}

export function getWorkspaceIdNoThrow(agent: ISessionAgent, providedWorkspaceId?: string) {
  const workspaceId = providedWorkspaceId
    ? providedWorkspaceId
    : agent.agentToken
    ? agent.agentToken.workspaceId
    : undefined;
  return workspaceId;
}

export function getWorkspaceIdFromSessionAgent(agent: ISessionAgent, providedWorkspaceId?: string) {
  const workspaceId = getWorkspaceIdNoThrow(agent, providedWorkspaceId);
  if (!workspaceId) {
    throw new InvalidRequestError('Workspace ID not provided');
  }
  return workspaceId;
}

export function tryGetAgentTokenId(
  agent: ISessionAgent,
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
  incomingTokenData: IBaseTokenData | undefined | null,
  type: AppResourceType
): incomingTokenData is IBaseTokenData {
  if (!incomingTokenData) {
    throw new PermissionDeniedError();
  }
  if (getResourceTypeFromId(incomingTokenData.sub.id) !== type) {
    throw new PermissionDeniedError();
  }
  return true;
}

export function assertGetWorkspaceIdFromAgent(agent: ISessionAgent) {
  const workspaceId = agent.agentToken ? agent.agentToken.workspaceId : null;
  if (!workspaceId) {
    throw new InvalidRequestError('Workspace ID not provided');
  }

  return workspaceId;
}

export function getActionAgentFromSessionAgent(sessionAgent: ISessionAgent): IAgent {
  const agent: IAgent = {
    agentId: sessionAgent.agentId,
    agentType: sessionAgent.agentType,
    agentTokenId: sessionAgent.agentTokenId,
  };
  return agent;
}

export function isSessionAgent(agent: any): agent is ISessionAgent {
  if (!(agent as ISessionAgent).agentId || !(agent as ISessionAgent).agentType) return false;
  if (
    (agent as ISessionAgent).agentToken ||
    (agent as ISessionAgent).user ||
    (agent as ISessionAgent).agentType === AppResourceType.System ||
    (agent as ISessionAgent).agentType === AppResourceType.Public
  )
    return true;

  return false;
}

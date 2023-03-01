import {ResourceWithTags} from '../definitions/assignedItem';
import {IClientAssignedToken} from '../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../definitions/programAccessToken';
import {AppResourceType, IAgent, IBaseTokenData, ISessionAgent} from '../definitions/system';
import {IUser} from '../definitions/user';
import {IUserToken} from '../definitions/userToken';
import {InvalidRequestError} from '../endpoints/errors';
import {PermissionDeniedError} from '../endpoints/user/errors';
import {getResourceTypeFromId} from './resourceId';

export function makeClientAssignedTokenAgent(
  clientAssignedToken: ResourceWithTags<IClientAssignedToken>
): ISessionAgent {
  return {
    clientAssignedToken,
    agentId: clientAssignedToken.resourceId,
    agentType: AppResourceType.ClientAssignedToken,
    tokenId: clientAssignedToken.resourceId,
  };
}

export function makeProgramAccessTokenAgent(
  programAccessToken: ResourceWithTags<IProgramAccessToken>
): ISessionAgent {
  return {
    programAccessToken,
    agentId: programAccessToken.resourceId,
    agentType: AppResourceType.ProgramAccessToken,
    tokenId: programAccessToken.resourceId,
  };
}

export function makeUserSessionAgent(user: IUser, userToken?: IUserToken): ISessionAgent {
  return {
    userToken,
    user,
    agentId: user.resourceId,
    agentType: AppResourceType.User,
    tokenId: userToken?.resourceId ?? null,
  };
}

export function getWorkspaceIdNoThrow(agent: ISessionAgent, providedWorkspaceId?: string) {
  const workspaceId = providedWorkspaceId
    ? providedWorkspaceId
    : agent.clientAssignedToken
    ? agent.clientAssignedToken.workspaceId
    : agent.programAccessToken
    ? agent.programAccessToken.workspaceId
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

export function getClientAssignedTokenIdNoThrow(
  agent: ISessionAgent,
  inputTokenId?: string | null,
  onReferenced?: boolean
) {
  const tokenId = inputTokenId
    ? inputTokenId
    : onReferenced
    ? agent.clientAssignedToken?.resourceId
    : null;
  return tokenId;
}

export function getClientAssignedTokenId(
  agent: ISessionAgent,
  inputTokenId?: string | null,
  onReferenced?: boolean
) {
  const tokenId = getClientAssignedTokenIdNoThrow(agent, inputTokenId, onReferenced);
  if (!tokenId) {
    throw new InvalidRequestError('Client assigned token ID not provided');
  }
  return tokenId;
}

export function getProgramAccessTokenId(
  agent: ISessionAgent,
  providedTokenId?: string | null,
  onReferenced?: boolean
) {
  const tokenId = providedTokenId
    ? providedTokenId
    : onReferenced
    ? agent.programAccessToken?.resourceId
    : null;

  if (!tokenId) {
    throw new InvalidRequestError('Program access token ID not provided');
  }

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
  const workspaceId = agent.clientAssignedToken
    ? agent.clientAssignedToken.workspaceId
    : agent.programAccessToken
    ? agent.programAccessToken.workspaceId
    : null;

  if (!workspaceId) {
    throw new InvalidRequestError('Workspace ID not provided');
  }

  return workspaceId;
}

export function getActionAgentFromSessionAgent(sessionAgent: ISessionAgent): IAgent {
  const agent = {
    agentId: sessionAgent.agentId,
    agentType: sessionAgent.agentType,
    tokenId: sessionAgent.tokenId,
  };
  return agent;
}

export function isSessionAgent(agent: any): agent is ISessionAgent {
  if (!(agent as ISessionAgent).agentId || !(agent as ISessionAgent).agentType) return false;
  if (
    (agent as ISessionAgent).programAccessToken ||
    (agent as ISessionAgent).clientAssignedToken ||
    (agent as ISessionAgent).user ||
    (agent as ISessionAgent).agentType === AppResourceType.System ||
    (agent as ISessionAgent).agentType === AppResourceType.Public
  )
    return true;

  return false;
}

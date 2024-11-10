import {OrArray} from 'softkave-js-utils';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {
  FimidaraResourceType,
  SessionAgent,
  TokenAccessScope,
} from '../../definitions/system.js';
import {appAssert} from '../../utils/assertion.js';
import {InvalidRequestError, NotFoundError} from '../errors.js';
import RequestData from '../RequestData.js';
import {EndpointOptionalWorkspaceIdParam} from '../types.js';
import {
  checkWorkspaceAuthorization,
  checkWorkspaceExists,
} from '../workspaces/utils.js';

function getUser(agent: SessionAgent) {
  const user = agent.user;
  appAssert(user, new NotFoundError('User not found'));

  return user;
}

function makeGetUser(agent: SessionAgent) {
  return () => getUser(agent);
}

async function getWorkspace(
  agent: SessionAgent,
  workspaceId: string,
  action: FimidaraPermissionAction
) {
  const workspace = await checkWorkspaceExists(workspaceId);
  await checkWorkspaceAuthorization(agent, workspaceId, action);
  return workspace;
}

function makeGetWorkspace(agent: SessionAgent, reqWorkspaceId: string) {
  return async (
    action: FimidaraPermissionAction,
    workspaceId = reqWorkspaceId
  ) => getWorkspace(agent, workspaceId, action);
}

// TODO: maybe action
export async function initEndpoint(
  reqData: RequestData,
  params: {
    permittedAgentType?: OrArray<FimidaraResourceType>;
    tokenScope?: OrArray<TokenAccessScope>;
    data?: EndpointOptionalWorkspaceIdParam;
  } = {}
) {
  const {
    data,
    permittedAgentType = kSessionUtils.permittedAgentType.api,
    tokenScope = kSessionUtils.accessScope.api,
  } = params;

  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(reqData, permittedAgentType, tokenScope);

  const agentWorkspaceId = agent.agentToken.workspaceId;
  const providedWorkspaceId =
    data?.workspaceId ||
    (reqData as RequestData<EndpointOptionalWorkspaceIdParam | undefined>).data
      ?.workspaceId;
  const workspaceId = providedWorkspaceId || agentWorkspaceId;
  appAssert(workspaceId, new InvalidRequestError('Workspace not found'));

  return {
    agent,
    workspaceId,
    getWorkspace: makeGetWorkspace(agent, workspaceId),
    getUser: makeGetUser(agent),
  };
}

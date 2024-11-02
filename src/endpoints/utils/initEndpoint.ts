import {OrArray} from 'softkave-js-utils';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {
  FimidaraPermissionAction,
  kFimidaraPermissionActions,
} from '../../definitions/permissionItem.js';
import {
  FimidaraResourceType,
  SessionAgent,
  TokenAccessScope,
} from '../../definitions/system.js';
import {Workspace} from '../../definitions/workspace.js';
import {appAssert} from '../../utils/assertion.js';
import {NotFoundError} from '../errors.js';
import RequestData from '../RequestData.js';
import {EndpointOptionalWorkspaceIdParam} from '../types.js';
import {
  checkWorkspaceAuthorization02,
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

// TODO: maybe action
export async function initEndpoint(
  reqData: RequestData,
  params: {
    permittedAgentType?: OrArray<FimidaraResourceType>;
    tokenScope?: OrArray<TokenAccessScope>;
    data?: EndpointOptionalWorkspaceIdParam;
    action?: FimidaraPermissionAction;
  } = {}
) {
  const {
    data,
    permittedAgentType = kSessionUtils.permittedAgentType.api,
    tokenScope = kSessionUtils.accessScope.api,
    action = kFimidaraPermissionActions.readWorkspace,
  } = params;

  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(reqData, permittedAgentType, tokenScope);

  const agentWorkspaceId = agent.agentToken.workspaceId;
  const providedWorkspaceId =
    data?.workspaceId ||
    (reqData as RequestData<EndpointOptionalWorkspaceIdParam | undefined>).data
      ?.workspaceId;

  let workspace: Workspace | undefined;
  if (providedWorkspaceId && agentWorkspaceId !== providedWorkspaceId) {
    ({workspace} = await checkWorkspaceAuthorization02(
      agent,
      action,
      providedWorkspaceId
    ));
  } else if (agentWorkspaceId) {
    workspace = await checkWorkspaceExists(agentWorkspaceId);
  }

  appAssert(workspace, new NotFoundError('Workspace not found'));
  return {
    agent,
    workspaceId: workspace.resourceId,
    workspace,
    getUser: makeGetUser(agent),
  };
}

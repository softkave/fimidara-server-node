import {AgentToken} from '../../../definitions/agentToken';
import {
  AppResourceTypeMap,
  CURRENT_TOKEN_VERSION,
  TokenAccessScopeMap,
} from '../../../definitions/system';
import {UserWithWorkspace} from '../../../definitions/user';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {newResource} from '../../../utils/resource';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {userExtractor} from '../utils';
import {LoginResult} from './types';

export function toLoginResult(
  context: BaseContextType,
  user: UserWithWorkspace,
  token: AgentToken,
  clientAssignedToken: AgentToken
): LoginResult {
  return {
    user: userExtractor(user),
    token: context.session.encodeToken(context, token.resourceId, token.expires),
    clientAssignedToken: context.session.encodeToken(
      context,
      clientAssignedToken.resourceId,
      token.expires
    ),
  };
}

export async function getUserClientAssignedToken(
  context: BaseContextType,
  userId: string,
  opts: SemanticProviderMutationRunOptions
) {
  appAssert(
    context.appVariables.appWorkspaceId,
    new ServerError(),
    'App workspace ID not set.'
  );
  appAssert(
    context.appVariables.appWorkspacesImageUploadPermissionGroupId,
    new ServerError(),
    'App workspaces image upload permission group ID not set.'
  );
  appAssert(
    context.appVariables.appUsersImageUploadPermissionGroupId,
    new ServerError(),
    'App users image upload permission group ID not set.'
  );

  let token = await context.semantic.agentToken.getByProvidedId(
    context.appVariables.appWorkspaceId,
    userId,
    opts
  );

  if (!token) {
    token = newResource<AgentToken>(AppResourceTypeMap.AgentToken, {
      providedResourceId: userId,
      workspaceId: context.appVariables.appWorkspaceId,
      version: CURRENT_TOKEN_VERSION,
      separateEntityId: null,
      agentType: AppResourceTypeMap.AgentToken,
      createdBy: SYSTEM_SESSION_AGENT,
      lastUpdatedBy: SYSTEM_SESSION_AGENT,
    });

    await Promise.all([
      context.semantic.agentToken.insertItem(token, opts),
      addAssignedPermissionGroupList(
        context,
        SYSTEM_SESSION_AGENT,
        context.appVariables.appWorkspaceId,
        [
          {
            permissionGroupId:
              context.appVariables.appWorkspacesImageUploadPermissionGroupId,
          },
          {permissionGroupId: context.appVariables.appUsersImageUploadPermissionGroupId},
        ],
        token.resourceId,
        /** deleteExisting */ false,
        /** skipPermissionGroupsExistCheck */ true,
        /** skip auth check */ true,
        opts
      ),
    ]);
  }

  return token;
}

export async function getUserToken(
  context: BaseContextType,
  userId: string,
  opts: SemanticProviderMutationRunOptions
) {
  let userToken = await context.semantic.agentToken.getOneAgentToken(
    userId,
    TokenAccessScopeMap.Login,
    opts
  );

  if (!userToken) {
    userToken = newResource<AgentToken>(AppResourceTypeMap.AgentToken, {
      scope: [TokenAccessScopeMap.Login],
      version: CURRENT_TOKEN_VERSION,
      separateEntityId: userId,
      workspaceId: null,
      agentType: AppResourceTypeMap.User,
      createdBy: SYSTEM_SESSION_AGENT,
      lastUpdatedBy: SYSTEM_SESSION_AGENT,
    });
    await context.semantic.agentToken.insertItem(userToken, opts);
  }

  return userToken;
}

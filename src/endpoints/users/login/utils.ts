import {AgentToken} from '../../../definitions/agentToken.js';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../definitions/system.js';
import {UserWithWorkspace} from '../../../definitions/user.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {appAssert} from '../../../utils/assertion.js';
import {ServerError} from '../../../utils/errors.js';
import {newResource} from '../../../utils/resource.js';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types.js';
import {userExtractor} from '../utils.js';
import {LoginResult} from './types.js';

export function toLoginResult(
  user: UserWithWorkspace,
  token: AgentToken,
  clientAssignedToken: AgentToken
): LoginResult {
  return {
    user: userExtractor(user),
    token: kUtilsInjectables.session().encodeToken(token.resourceId, token.expiresAt),
    clientAssignedToken: kUtilsInjectables
      .session()
      .encodeToken(clientAssignedToken.resourceId, token.expiresAt),
  };
}

export async function getUserClientAssignedToken(
  userId: string,
  opts: SemanticProviderMutationParams
) {
  appAssert(
    kUtilsInjectables.runtimeConfig().appWorkspaceId,
    new ServerError(),
    'App workspace ID not set'
  );
  appAssert(
    kUtilsInjectables.runtimeConfig().appWorkspacesImageUploadPermissionGroupId,
    new ServerError(),
    'App workspaces image upload permission group ID not set'
  );
  appAssert(
    kUtilsInjectables.runtimeConfig().appUsersImageUploadPermissionGroupId,
    new ServerError(),
    'App users image upload permission group ID not set'
  );

  let token = await kSemanticModels
    .agentToken()
    .getByProvidedId(kUtilsInjectables.runtimeConfig().appWorkspaceId, userId, opts);

  if (!token) {
    token = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
      providedResourceId: userId,
      workspaceId: kUtilsInjectables.runtimeConfig().appWorkspaceId,
      version: kCurrentJWTTokenVersion,
      forEntityId: userId,
      entityType: kFimidaraResourceType.User,
      createdBy: kSystemSessionAgent,
      lastUpdatedBy: kSystemSessionAgent,
      scope: [kTokenAccessScope.access],
    });

    const {
      appWorkspaceId,
      appUsersImageUploadPermissionGroupId,
      appWorkspacesImageUploadPermissionGroupId,
    } = kUtilsInjectables.runtimeConfig();
    await Promise.all([
      kSemanticModels.agentToken().insertItem(token, opts),
      addAssignedPermissionGroupList(
        kSystemSessionAgent,
        appWorkspaceId,
        [
          {permissionGroupId: appWorkspacesImageUploadPermissionGroupId},
          {permissionGroupId: appUsersImageUploadPermissionGroupId},
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

export async function getUserToken(userId: string, opts: SemanticProviderMutationParams) {
  let userToken = await kSemanticModels
    .agentToken()
    .getOneAgentToken(userId, kTokenAccessScope.login, opts);

  if (!userToken) {
    userToken = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
      scope: [kTokenAccessScope.login],
      version: kCurrentJWTTokenVersion,
      forEntityId: userId,
      workspaceId: null,
      entityType: kFimidaraResourceType.User,
      createdBy: kSystemSessionAgent,
      lastUpdatedBy: kSystemSessionAgent,
    });
    await kSemanticModels.agentToken().insertItem(userToken, opts);
  }

  return userToken;
}

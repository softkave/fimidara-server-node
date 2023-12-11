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
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {userExtractor} from '../utils';
import {LoginResult} from './types';

export function toLoginResult(
  user: UserWithWorkspace,
  token: AgentToken,
  clientAssignedToken: AgentToken
): LoginResult {
  return {
    user: userExtractor(user),
    token: kUtilsInjectables.session().encodeToken(token.resourceId, token.expires),
    clientAssignedToken: kUtilsInjectables
      .session()
      .encodeToken(clientAssignedToken.resourceId, token.expires),
  };
}

export async function getUserClientAssignedToken(
  userId: string,
  opts: SemanticProviderMutationRunOptions
) {
  appAssert(
    kUtilsInjectables.config().appWorkspaceId,
    new ServerError(),
    'App workspace ID not set.'
  );
  appAssert(
    kUtilsInjectables.config().appWorkspacesImageUploadPermissionGroupId,
    new ServerError(),
    'App workspaces image upload permission group ID not set.'
  );
  appAssert(
    kUtilsInjectables.config().appUsersImageUploadPermissionGroupId,
    new ServerError(),
    'App users image upload permission group ID not set.'
  );

  let token = await kSemanticModels
    .agentToken()
    .getByProvidedId(kUtilsInjectables.config().appWorkspaceId, userId, opts);

  if (!token) {
    token = newResource<AgentToken>(AppResourceTypeMap.AgentToken, {
      providedResourceId: userId,
      workspaceId: kUtilsInjectables.config().appWorkspaceId,
      version: CURRENT_TOKEN_VERSION,
      separateEntityId: null,
      agentType: AppResourceTypeMap.AgentToken,
      createdBy: SYSTEM_SESSION_AGENT,
      lastUpdatedBy: SYSTEM_SESSION_AGENT,
    });

    await Promise.all([
      kSemanticModels.agentToken().insertItem(token, opts),
      addAssignedPermissionGroupList(
        SYSTEM_SESSION_AGENT,
        kUtilsInjectables.config().appWorkspaceId,
        [
          {
            permissionGroupId:
              kUtilsInjectables.config().appWorkspacesImageUploadPermissionGroupId,
          },
          {
            permissionGroupId:
              kUtilsInjectables.config().appUsersImageUploadPermissionGroupId,
          },
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
  userId: string,
  opts: SemanticProviderMutationRunOptions
) {
  let userToken = await kSemanticModels
    .agentToken()
    .getOneAgentToken(userId, TokenAccessScopeMap.Login, opts);

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
    await kSemanticModels.agentToken().insertItem(userToken, opts);
  }

  return userToken;
}

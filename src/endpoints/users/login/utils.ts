import {AgentToken} from '../../../definitions/agentToken';
import {
  kAppResourceType,
  kCurrentJWTTokenVersion,
  kTokenAccessScope,
} from '../../../definitions/system';
import {UserWithWorkspace} from '../../../definitions/user';
import {kSystemSessionAgent} from '../../../utils/agent';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {newResource} from '../../../utils/resource';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
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
    token = newResource<AgentToken>(kAppResourceType.AgentToken, {
      providedResourceId: userId,
      workspaceId: kUtilsInjectables.config().appWorkspaceId,
      version: kCurrentJWTTokenVersion,
      separateEntityId: null,
      agentType: kAppResourceType.AgentToken,
      createdBy: kSystemSessionAgent,
      lastUpdatedBy: kSystemSessionAgent,
    });

    await Promise.all([
      kSemanticModels.agentToken().insertItem(token, opts),
      addAssignedPermissionGroupList(
        kSystemSessionAgent,
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
    .getOneAgentToken(userId, kTokenAccessScope.Login, opts);

  if (!userToken) {
    userToken = newResource<AgentToken>(kAppResourceType.AgentToken, {
      scope: [kTokenAccessScope.Login],
      version: kCurrentJWTTokenVersion,
      separateEntityId: userId,
      workspaceId: null,
      agentType: kAppResourceType.User,
      createdBy: kSystemSessionAgent,
      lastUpdatedBy: kSystemSessionAgent,
    });
    await kSemanticModels.agentToken().insertItem(userToken, opts);
  }

  return userToken;
}

import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  ISessionAgent,
  TokenFor,
} from '../../../definitions/system';
import {IUserWithWorkspace} from '../../../definitions/user';
import {IUserToken} from '../../../definitions/userToken';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {ServerError} from '../../../utils/errors';
import {newResource} from '../../../utils/fns';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {userExtractor} from '../utils';
import {ILoginResult} from './types';

export function toLoginResult(
  context: IBaseContext,
  user: IUserWithWorkspace,
  token: IUserToken,
  clientAssignedToken: IClientAssignedToken
): ILoginResult {
  return {
    user: userExtractor(user),
    token: context.session.encodeToken(
      context,
      token.resourceId,
      AppResourceType.UserToken,
      token.expires
    ),
    clientAssignedToken: context.session.encodeToken(
      context,
      clientAssignedToken.resourceId,
      AppResourceType.ClientAssignedToken,
      token.expires
    ),
  };
}

export async function getUserClientAssignedToken(context: IBaseContext, agent: ISessionAgent) {
  appAssert(context.appVariables.appWorkspaceId, new ServerError(), 'App workspace ID not set.');
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

  let token = await context.semantic.clientAssignedToken.getByProvidedId(
    context.appVariables.appWorkspaceId,
    agent.agentId
  );

  if (!token) {
    token = newResource(agent, AppResourceType.ClientAssignedToken, {
      providedResourceId: agent.agentId,
      workspaceId: context.appVariables.appWorkspaceId,
      version: CURRENT_TOKEN_VERSION,
    });
    context.semantic.clientAssignedToken.insertItem(token);
    addAssignedPermissionGroupList(
      context,
      agent,
      context.appVariables.appWorkspaceId,
      [
        {permissionGroupId: context.appVariables.appWorkspacesImageUploadPermissionGroupId},
        {permissionGroupId: context.appVariables.appUsersImageUploadPermissionGroupId},
      ],
      token.resourceId,
      /** deleteExisting */ false,
      /** skipPermissionGroupsExistCheck */ true
    );
  }

  return token;
}

export async function getUserToken(context: IBaseContext, agent: ISessionAgent) {
  appAssert(
    agent.agentType === AppResourceType.User,
    new ServerError(),
    'Session agent must be a user session agent.'
  );
  let userToken = await context.semantic.userToken.getOneByUserId(agent.agentId, TokenFor.Login);
  if (!userToken) {
    userToken = newResource(agent, AppResourceType.UserToken, {
      userId: agent.agentId,
      tokenFor: [TokenFor.Login],
      issuedAt: getTimestamp(),
      version: CURRENT_TOKEN_VERSION,
    });
    await context.semantic.userToken.insertItem(userToken);
  }

  return userToken;
}

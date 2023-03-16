import {IAgentToken} from '../../../definitions/agentToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  SYSTEM_SESSION_AGENT,
  TokenAccessScope,
} from '../../../definitions/system';
import {IUserWithWorkspace} from '../../../definitions/user';
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
  token: IAgentToken,
  clientAssignedToken: IAgentToken
): ILoginResult {
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

export async function getUserClientAssignedToken(context: IBaseContext, userId: string) {
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

  let token = await context.semantic.agentToken.getByProvidedId(
    context.appVariables.appWorkspaceId,
    userId
  );

  if (!token) {
    token = newResource(AppResourceType.AgentToken, {
      providedResourceId: userId,
      workspaceId: context.appVariables.appWorkspaceId,
      version: CURRENT_TOKEN_VERSION,
      separateEntityId: null,
      agentType: AppResourceType.AgentToken,
      createdBy: SYSTEM_SESSION_AGENT,
      lastUpdatedBy: SYSTEM_SESSION_AGENT,
    });
    context.semantic.agentToken.insertItem(token);
    addAssignedPermissionGroupList(
      context,
      SYSTEM_SESSION_AGENT,
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

export async function getUserToken(context: IBaseContext, userId: string) {
  let userToken = await context.semantic.agentToken.getOneAgentToken(
    userId,
    TokenAccessScope.Login
  );
  if (!userToken) {
    userToken = newResource(AppResourceType.AgentToken, {
      userId: userId,
      tokenFor: [TokenAccessScope.Login],
      issuedAt: getTimestamp(),
      version: CURRENT_TOKEN_VERSION,
      separateEntityId: userId,
      workspaceId: null,
      agentType: AppResourceType.User,
      createdBy: SYSTEM_SESSION_AGENT,
      lastUpdatedBy: SYSTEM_SESSION_AGENT,
    });
    await context.semantic.agentToken.insertItem(userToken);
  }

  return userToken;
}

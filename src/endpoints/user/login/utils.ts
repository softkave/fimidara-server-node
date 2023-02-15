import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  systemAgent,
  TokenAudience,
  TokenType,
} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {IUserToken} from '../../../definitions/userToken';
import {appAssert} from '../../../utils/assertion';
import {getDateString} from '../../../utils/dateFns';
import {ServerError} from '../../../utils/errors';
import {getNewIdForResource} from '../../../utils/resourceId';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {assertWorkspace} from '../../workspaces/utils';
import UserTokenQueries from '../UserTokenQueries';
import {userExtractor} from '../utils';
import {ILoginResult} from './types';

export function toLoginResult(
  context: IBaseContext,
  user: IUser,
  token: IUserToken,
  clientAssignedToken: IClientAssignedToken
): ILoginResult {
  return {
    user: userExtractor(user),
    token: context.session.encodeToken(
      context,
      token.resourceId,
      TokenType.UserToken,
      token.expires
    ),
    clientAssignedToken: context.session.encodeToken(
      context,
      clientAssignedToken.resourceId,
      TokenType.ClientAssignedToken,
      token.expires
    ),
  };
}

export async function getUserClientAssignedToken(context: IBaseContext, userId: string) {
  appAssert(context.appVariables.appWorkspaceId, new ServerError(), 'App workspace ID not set');
  appAssert(
    context.appVariables.appWorkspacesImageUploadPermissionGroupId,
    new ServerError(),
    'App workspaces image upload permission group ID not set'
  );
  appAssert(
    context.appVariables.appUsersImageUploadPermissionGroupId,
    new ServerError(),
    'App users image upload permission group ID not set'
  );

  let token = await context.data.clientAssignedToken.getOneByQuery(
    EndpointReusableQueries.getByProvidedId(context.appVariables.appWorkspaceId, userId)
  );

  if (!token) {
    const createdAt = getDateString();
    token = await context.data.clientAssignedToken.insertItem({
      createdAt,
      lastUpdatedAt: createdAt,
      lastUpdatedBy: systemAgent,
      resourceId: getNewIdForResource(AppResourceType.ClientAssignedToken),
      providedResourceId: userId,
      createdBy: systemAgent,
      workspaceId: context.appVariables.appWorkspaceId,
      version: CURRENT_TOKEN_VERSION,
    });

    const workspace = await context.data.workspace.getOneByQuery(
      EndpointReusableQueries.getByResourceId(context.appVariables.appWorkspaceId)
    );
    assertWorkspace(workspace);
    addAssignedPermissionGroupList(
      context,
      systemAgent,
      workspace,
      [
        {
          order: 1,
          permissionGroupId: context.appVariables.appWorkspacesImageUploadPermissionGroupId,
        },
        {
          order: 2,
          permissionGroupId: context.appVariables.appUsersImageUploadPermissionGroupId,
        },
      ],
      token.resourceId,
      AppResourceType.ClientAssignedToken,
      /** deleteExisting */ false,
      /** skipPermissionGroupsCheck */ true
    );
  }

  return token;
}

export async function getUserToken(context: IBaseContext, user: IUser) {
  let userToken = await context.data.userToken.getOneByQuery(
    UserTokenQueries.getByUserIdAndAudience(user.resourceId, TokenAudience.Login)
  );

  if (!userToken) {
    userToken = await context.data.userToken.insertItem({
      resourceId: getNewIdForResource(AppResourceType.UserToken),
      userId: user.resourceId,
      audience: [TokenAudience.Login],
      issuedAt: getDateString(),
      version: CURRENT_TOKEN_VERSION,
    });
  }

  return userToken;
}

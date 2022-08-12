import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {AppResourceType, systemAgent} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {IUserToken} from '../../../definitions/userToken';
import {getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import {appAssert} from '../../../utilities/fns';
import {getNewIdForResource} from '../../../utilities/resourceId';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
  TokenType,
} from '../../contexts/SessionContext';
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

export async function getUserClientAssignedToken(
  context: IBaseContext,
  userId: string
) {
  appAssert(
    context.appVariables.appWorkspaceId,
    new ServerError(),
    'App workspace ID not set'
  );

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

  let token = await context.data.clientAssignedToken.getItem(
    EndpointReusableQueries.getByProvidedId(
      context.appVariables.appWorkspaceId,
      userId
    )
  );

  if (!token) {
    const createdAt = getDateString();
    token = await context.data.clientAssignedToken.saveItem({
      createdAt,
      lastUpdatedAt: createdAt,
      lastUpdatedBy: systemAgent,
      resourceId: getNewIdForResource(AppResourceType.ClientAssignedToken),
      providedResourceId: userId,
      createdBy: systemAgent,
      workspaceId: context.appVariables.appWorkspaceId,
      version: CURRENT_TOKEN_VERSION,
      issuedAt: getDateString(),
    });

    const workspace = await context.cacheProviders.workspace.getById(
      context,
      context.appVariables.appWorkspaceId
    );
    assertWorkspace(workspace);
    addAssignedPermissionGroupList(
      context,
      systemAgent,
      workspace,
      [
        {
          order: 1,
          permissionGroupId:
            context.appVariables.appWorkspacesImageUploadPermissionGroupId,
        },
        {
          order: 2,
          permissionGroupId:
            context.appVariables.appUsersImageUploadPermissionGroupId,
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
  let userToken = await context.data.userToken.getItem(
    UserTokenQueries.getByUserIdAndAudience(
      user.resourceId,
      TokenAudience.Login
    )
  );

  if (!userToken) {
    userToken = await context.data.userToken.saveItem({
      resourceId: getNewIdForResource(AppResourceType.UserToken),
      userId: user.resourceId,
      audience: [TokenAudience.Login],
      issuedAt: getDateString(),
      version: CURRENT_TOKEN_VERSION,
    });
  }

  return userToken;
}

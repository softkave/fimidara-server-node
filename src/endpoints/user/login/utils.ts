import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {systemAgent} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {IUserToken} from '../../../definitions/userToken';
import {getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import {appAssert} from '../../../utilities/fns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
  TokenType,
} from '../../contexts/SessionContext';
import EndpointReusableQueries from '../../queries';
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
    context.appVariables.appOrganizationId,
    new ServerError(),
    'App organization ID not set'
  );

  appAssert(
    context.appVariables.appOrgsImageUploadPresetId,
    new ServerError(),
    'App orgs image upload preset ID not set'
  );

  appAssert(
    context.appVariables.appUsersImageUploadPresetId,
    new ServerError(),
    'App users image upload preset ID not set'
  );

  let token = await context.data.clientAssignedToken.getItem(
    EndpointReusableQueries.getByProvidedId(
      context.appVariables.appOrganizationId,
      userId
    )
  );

  if (!token) {
    token = await context.data.clientAssignedToken.saveItem({
      resourceId: getNewId(),
      providedResourceId: userId,
      createdAt: getDateString(),
      createdBy: systemAgent,
      organizationId: context.appVariables.appOrganizationId,
      version: CURRENT_TOKEN_VERSION,
      presets: [
        {
          assignedAt: getDateString(),
          assignedBy: systemAgent,
          order: 1,
          presetId: context.appVariables.appOrgsImageUploadPresetId,
        },
        {
          assignedAt: getDateString(),
          assignedBy: systemAgent,
          order: 2,
          presetId: context.appVariables.appUsersImageUploadPresetId,
        },
      ],
      issuedAt: getDateString(),
    });
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
      resourceId: getNewId(),
      userId: user.resourceId,
      audience: [TokenAudience.Login],
      issuedAt: getDateString(),
      version: CURRENT_TOKEN_VERSION,
    });
  }

  return userToken;
}

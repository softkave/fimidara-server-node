import {URL} from 'url';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  TokenAccessScope,
} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {newResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {IBaseContext} from '../../contexts/types';
import {userConstants} from '../constants';

export async function withConfirmEmailAddressToken(
  context: IBaseContext,
  user: IUser,
  link: string
) {
  const url = new URL(link);
  if (!url.searchParams.has(userConstants.confirmEmailTokenQueryParam) && !user.isEmailVerified) {
    let token = await context.semantic.agentToken.getOneAgentToken(
      user.resourceId,
      TokenAccessScope.ConfirmEmailAddress
    );

    if (!token) {
      token = newResource(makeUserSessionAgent(user), AppResourceType.UserToken, {
        tokenAccessScope: [TokenAccessScope.ConfirmEmailAddress],
        resourceId: getNewIdForResource(AppResourceType.UserToken),
        userId: user.resourceId,
        version: CURRENT_TOKEN_VERSION,
      });
      await context.semantic.userToken.insertItem(token);
    }

    const encodedToken = context.session.encodeToken(
      context,
      token.resourceId,
      AppResourceType.UserToken,
      token.expires
    );
    url.searchParams.set(userConstants.confirmEmailTokenQueryParam, encodedToken);
    link = url.toString();
  }

  return link;
}

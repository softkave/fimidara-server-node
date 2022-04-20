import {URL} from 'url';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
  TokenType,
} from '../../contexts/SessionContext';
import {userConstants} from '../constants';
import UserTokenQueries from '../UserTokenQueries';

export async function withConfirmEmailAddressToken(
  context: IBaseContext,
  user: {resourceId: string; isEmailVerified?: boolean},
  link: string
) {
  const url = new URL(link);

  if (
    !url.searchParams.has(userConstants.confirmEmailTokenQueryParam) &&
    !user.isEmailVerified
  ) {
    let token = await context.data.userToken.getItem(
      UserTokenQueries.getByUserIdAndAudience(
        user.resourceId,
        TokenAudience.ConfirmEmailAddress
      )
    );

    if (!token) {
      token = await context.data.userToken.saveItem({
        audience: [TokenAudience.ConfirmEmailAddress],
        issuedAt: getDateString(),
        resourceId: getNewId(),
        userId: user.resourceId,
        version: CURRENT_TOKEN_VERSION,
      });
    }

    const encodedToken = context.session.encodeToken(
      context,
      token.resourceId,
      TokenType.UserToken,
      token.expires
    );

    url.searchParams.set(
      userConstants.confirmEmailTokenQueryParam,
      encodedToken
    );

    link = url.toString();
  }

  return link;
}

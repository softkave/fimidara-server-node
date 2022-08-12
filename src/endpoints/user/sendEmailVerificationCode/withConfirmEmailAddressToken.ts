import {URL} from 'url';
import {AppResourceType} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import {getNewIdForResource} from '../../../utilities/resourceId';
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
  user: Pick<IUser, 'resourceId' | 'isEmailVerified'>,
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
        resourceId: getNewIdForResource(AppResourceType.UserToken),
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

import {TokenFor} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {IBaseContext} from '../../contexts/types';
import {assertUser} from '../utils';

/**
 * Confirms the email address of the user. For internal use only.
 */
export default async function internalConfirmEmailAddress(
  context: IBaseContext,
  userId: string,
  user?: IUser | null
) {
  if (!user) {
    user = await context.semantic.user.getOneById(userId);
    assertUser(user);
  }

  if (user.isEmailVerified) {
    return user;
  }

  user = await context.semantic.user.getAndUpdateOneById(user.resourceId, {
    isEmailVerified: true,
    emailVerifiedAt: getTimestamp(),
  });
  context.semantic.userToken.deleteUserExistingTokens(
    user.resourceId,
    TokenFor.ConfirmEmailAddress
  );

  return user;
}

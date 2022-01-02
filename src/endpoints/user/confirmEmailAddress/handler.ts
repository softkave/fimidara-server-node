import {EmailAddressVerifiedError} from '../errors';
import {ConfirmEmailAddressEndpoint} from './types';
import {getDateString} from '../../../utilities/dateFns';
import {userExtractor} from '../utils';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
  TokenType,
} from '../../contexts/SessionContext';
import UserQueries from '../UserQueries';
import UserTokenQueries from '../UserTokenQueries';
import getNewId from '../../../utilities/getNewId';

/**
 * confirmEmailAddress. Ensure that:
 * - User exists and is not already verified
 * - Update user data with verification details
 * - Delete token used to verify user
 * - Reuse login token if one exists or create a new one
 * - Return user data and encoded token
 */

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async (
  context,
  instData
) => {
  let user = await context.session.getUser(context, instData, [
    TokenAudience.ConfirmEmailAddress,
  ]);

  if (user.isEmailVerified) {
    throw new EmailAddressVerifiedError();
  }

  user = await context.data.user.assertUpdateItem(
    UserQueries.getById(user.userId),
    {
      isEmailVerified: true,
      emailVerifiedAt: getDateString(),
    }
  );

  // Delete the token used for this request cause it's no longer needed
  // Fire and forget cause it's not needed that the call succeeds
  fireAndForgetPromise(
    context.data.userToken.deleteItem(
      // It's okay to disable this check because incomingTokenData
      // exists cause it's checked already in session.getUser
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      UserTokenQueries.getById(instData.incomingTokenData!.sub.id)
    )
  );

  let userToken = await context.data.userToken.getItem(
    UserTokenQueries.getByUserIdAndAudience(user.userId, TokenAudience.Login)
  );

  if (!userToken) {
    userToken = await context.data.userToken.saveItem({
      tokenId: getNewId(),
      userId: user.userId,
      version: CURRENT_TOKEN_VERSION,
      issuedAt: getDateString(),
      audience: [TokenAudience.Login],
    });
  }

  const encodedToken = context.session.encodeToken(
    context,
    userToken.tokenId,
    TokenType.UserToken,
    userToken.expires
  );

  return {
    user: userExtractor(user),
    token: encodedToken,
  };
};

export default confirmEmailAddress;

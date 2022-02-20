import {addMinutes, isBefore} from 'date-fns';
import {EmailAddressVerifiedError} from '../errors';
import {SendEmailVerificationCodeEndpoint} from './types';
import {formatDate, getDateString} from '../../../utilities/dateFns';
import {RateLimitError} from '../../errors';
import {userConstants} from '../constants';
import * as querystring from 'querystring';
import getNewId from '../../../utilities/getNewId';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
  TokenType,
} from '../../contexts/SessionContext';
import sendConfirmEmailAddressEmail from './sendConfirmEmailAddressEmail';
import UserQueries from '../UserQueries';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {IBaseContext} from '../../contexts/BaseContext';
import {IUserToken} from '../../../definitions/userToken';

/**
 * sendEmailVerificationCode. Ensure that:
 * - Email is not already verified
 * - Create email verification token
 * - Send email verification email
 * - Update user email verification email sent date
 */

const sendEmailVerificationCode: SendEmailVerificationCodeEndpoint = async (
  context,
  instData
) => {
  const user = await context.session.getUser(context, instData);

  if (user.isEmailVerified) {
    throw new EmailAddressVerifiedError();
  }

  if (user.emailVerificationEmailSentAt) {
    // Throw an error if the last time an email verification was sent is less than the rate limit
    const nextDate = addMinutes(
      new Date(user.emailVerificationEmailSentAt),
      userConstants.verificationCodeRateLimitInMins
    );

    const shouldLimitRate = isBefore(new Date(), nextDate);

    if (shouldLimitRate) {
      throw new RateLimitError(
        `We sent an email verification email to ${user.email} on ${formatDate(
          user.emailVerificationEmailSentAt
        )}. Please try again later from ${formatDate(nextDate)}.`
      );
    }
  }

  const token = await context.data.userToken.saveItem({
    audience: [TokenAudience.ConfirmEmailAddress],
    issuedAt: getDateString(),
    resourceId: getNewId(),
    userId: user.resourceId,
    version: CURRENT_TOKEN_VERSION,
  });

  const link = getConfirmEmailLink(context, token);
  await sendConfirmEmailAddressEmail(context, {
    link,
    emailAddress: user.email,
    firstName: user.firstName,
  });

  fireAndForgetPromise(
    context.data.user.updateItem(UserQueries.getById(user.resourceId), {
      emailVerificationEmailSentAt: getDateString(),
    })
  );
};

export default sendEmailVerificationCode;

export function getConfirmEmailLink(context: IBaseContext, token: IUserToken) {
  const encodedToken = context.session.encodeToken(
    context,
    token.resourceId,
    TokenType.UserToken,
    token.expires
  );

  return `${context.appVariables.clientDomain}${
    context.appVariables.verifyEmailPath
  }?${querystring.stringify({
    [userConstants.defaultTokenQueryParam]: encodedToken,
  })}`;
}

import {addMinutes, isBefore} from 'date-fns';
import {IUser} from '../../../definitions/user';
import {formatDate, getTimestamp} from '../../../utils/dateFns';
import {MemStore} from '../../contexts/mem/Mem';
import {IBaseContext} from '../../contexts/types';
import {RateLimitError} from '../../errors';
import {userConstants} from '../constants';
import {EmailAddressVerifiedError} from '../errors';
import sendConfirmEmailAddressEmail from './sendConfirmEmailAddressEmail';
import {SendEmailVerificationCodeEndpoint} from './types';
import {withConfirmEmailAddressToken} from './withConfirmEmailAddressToken';

const sendEmailVerificationCode: SendEmailVerificationCodeEndpoint = async (context, instData) => {
  const user = await context.session.getUser(context, instData);
  if (user.isEmailVerified) {
    throw new EmailAddressVerifiedError();
  }

  if (user.emailVerificationEmailSentAt) {
    // Throw an error if the last time an email verification was sent is less
    // than the rate limit
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

  const link = await getConfirmEmailLink(context, user);
  await Promise.all([
    sendConfirmEmailAddressEmail(context, {
      link,
      emailAddress: user.email,
      firstName: user.firstName,
    }),
    MemStore.withTransaction(context, async txn => {
      await context.semantic.user.updateOneById(
        user.resourceId,
        {emailVerificationEmailSentAt: getTimestamp()},
        {transaction: txn}
      );
    }),
  ]);
};

export async function getConfirmEmailLink(context: IBaseContext, user: IUser) {
  return await withConfirmEmailAddressToken(
    context,
    user,
    `${context.appVariables.clientDomain}${context.appVariables.verifyEmailPath}`
  );
}

export default sendEmailVerificationCode;

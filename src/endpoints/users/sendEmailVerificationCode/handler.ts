import {addMinutes, isBefore} from 'date-fns';
import {User} from '../../../definitions/user';
import {formatDate, getTimestamp} from '../../../utils/dateFns';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import {RateLimitError} from '../../errors';
import {userConstants} from '../constants';
import {EmailAddressVerifiedError} from '../errors';
import sendConfirmEmailAddressEmail from './sendConfirmEmailAddressEmail';
import {SendEmailVerificationCodeEndpoint} from './types';
import {withConfirmEmailAddressToken} from './withConfirmEmailAddressToken';

const sendEmailVerificationCode: SendEmailVerificationCodeEndpoint = async (context, instData) => {
  const user = await context.session.getUser(context, instData);
  await INTERNAL_sendEmailVerificationCode(context, user);
};

export async function INTERNAL_sendEmailVerificationCode(
  context: BaseContextType,
  user: User,
  opts?: SemanticDataAccessProviderMutationRunOptions
) {
  await executeWithMutationRunOptions(
    context,
    async opts => {
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

      const link = await getConfirmEmailLink(context, user, opts);
      await Promise.all([
        sendConfirmEmailAddressEmail(context, {
          link,
          emailAddress: user.email,
          firstName: user.firstName,
          signupLink: context.appVariables.clientSignupLink,
          loginLink: context.appVariables.clientLoginLink,
        }),
        context.semantic.user.updateOneById(
          user.resourceId,
          {emailVerificationEmailSentAt: getTimestamp()},
          opts
        ),
      ]);
    },
    opts
  );
}

export async function getConfirmEmailLink(
  context: BaseContextType,
  user: User,
  opts?: SemanticDataAccessProviderMutationRunOptions
) {
  return await withConfirmEmailAddressToken(
    context,
    user,
    `${context.appVariables.clientDomain}${context.appVariables.verifyEmailLink}`,
    opts
  );
}

export default sendEmailVerificationCode;

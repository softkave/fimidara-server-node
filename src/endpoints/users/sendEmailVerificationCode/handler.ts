import {addMinutes, isBefore} from 'date-fns';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {
  EmailJobParams,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {User} from '../../../definitions/user.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {formatDate} from '../../../utils/dateFns.js';
import {RateLimitError} from '../../errors.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {kUserConstants} from '../constants.js';
import {EmailAddressVerifiedError} from '../errors.js';
import {SendEmailVerificationCodeEndpoint} from './types.js';

const sendEmailVerificationCode: SendEmailVerificationCodeEndpoint =
  async reqData => {
    const user = await kIjxUtils
      .session()
      .getUser(reqData, kSessionUtils.accessScopes.user);
    await INTERNAL_sendEmailVerificationCode(user);
  };

export async function INTERNAL_sendEmailVerificationCode(user: User) {
  if (user.isEmailVerified) {
    throw new EmailAddressVerifiedError();
  }

  if (user.emailVerificationEmailSentAt) {
    // Throw an error if the last time an email verification was sent is less
    // than the rate limit
    const nextDate = addMinutes(
      new Date(user.emailVerificationEmailSentAt),
      kUserConstants.verificationCodeRateLimitInMins
    );
    const shouldLimitRate = isBefore(new Date(), nextDate);

    if (shouldLimitRate) {
      throw new RateLimitError(
        `We sent an email verification email to ${user.email} on ${formatDate(
          user.emailVerificationEmailSentAt
        )}. Please try again later from ${formatDate(nextDate)}`
      );
    }
  }

  kIjxUtils.promises().callAndForget(() =>
    queueJobs<EmailJobParams>(
      /** workspace ID */ undefined,
      /** parent job ID */ undefined,
      {
        createdBy: kSystemSessionAgent,
        type: kJobType.email,
        idempotencyToken: Date.now().toString(),
        params: {
          type: kEmailJobType.confirmEmailAddress,
          emailAddress: [user.email],
          userId: [user.resourceId],
        },
      }
    )
  );
}

export default sendEmailVerificationCode;

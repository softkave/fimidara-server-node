import {addMinutes, isBefore} from 'date-fns';
import {EmailJobParams, kEmailJobType, kJobType} from '../../../definitions/job';
import {User} from '../../../definitions/user';
import {kSystemSessionAgent} from '../../../utils/agent';
import {formatDate} from '../../../utils/dateFns';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {RateLimitError} from '../../errors';
import {queueJobs} from '../../jobs/queueJobs';
import {kUserConstants} from '../constants';
import {EmailAddressVerifiedError} from '../errors';
import {SendEmailVerificationCodeEndpoint} from './types';

const sendEmailVerificationCode: SendEmailVerificationCodeEndpoint = async instData => {
  const user = await kUtilsInjectables
    .session()
    .getUser(instData, kSessionUtils.accessScopes.user);
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

  kUtilsInjectables.promises().forget(
    // queueEmailMessage(
    //   user.email,
    //   {type: kEmailMessageType.confirmEmailAddress, params: {}},
    //   undefined,
    //   user.resourceId,
    //   {reuseTxn: false}
    // )

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

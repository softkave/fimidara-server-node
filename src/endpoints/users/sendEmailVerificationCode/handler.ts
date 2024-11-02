import {addMinutes, isBefore} from 'date-fns';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {
  EmailJobParams,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {appAssert} from '../../../utils/assertion.js';
import {formatDate} from '../../../utils/dateFns.js';
import {validate} from '../../../utils/validate.js';
import {RateLimitError} from '../../errors.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {kUserConstants} from '../constants.js';
import {EmailAddressVerifiedError} from '../errors.js';
import {getUserFromSessionAgent} from '../utils/getUserFromSessionAgent.js';
import {SendEmailVerificationCodeEndpoint} from './types.js';
import {sendEmailVerificationCodeJoiSchema} from './validation.js';

const sendEmailVerificationCodeEndpoint: SendEmailVerificationCodeEndpoint =
  async reqData => {
    const data = validate(reqData.data, sendEmailVerificationCodeJoiSchema);
    const {workspace, agent} = await initEndpoint(reqData);

    const user = await kSemanticModels.utils().withTxn(async opts => {
      return await getUserFromSessionAgent(
        agent,
        /** params */ {workspaceId: workspace.resourceId, userId: data.userId},
        opts
      );
    });

    appAssert(!user.isEmailVerified, new EmailAddressVerifiedError());
    if (user.emailVerificationEmailSentAt) {
      // throw an error if the last time an email verification email was sent is
      // less than the rate limit
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
      queueJobs<EmailJobParams>(
        /** workspaceId */ workspace.resourceId,
        /** parentJobId */ undefined,
        /** jobsInput */ {
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
  };

export default sendEmailVerificationCodeEndpoint;

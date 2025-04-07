import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {
  EmailJobParams,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {User} from '../../../definitions/user.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {InvalidRequestError} from '../../errors.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {assertUser} from '../utils.js';
import {ForgotPasswordEndpoint} from './types.js';
import {forgotPasswordJoiSchema} from './validation.js';

export const forgotPassword: ForgotPasswordEndpoint = async reqData => {
  const data = validate(reqData.data, forgotPasswordJoiSchema);
  const user = await kIjxSemantic.user().getByEmail(data.email);
  assertUser(user);
  await INTERNAL_forgotPassword(user);
};

export async function INTERNAL_forgotPassword(user: User) {
  appAssert(
    user.hash,
    new InvalidRequestError(
      'User has no prior password set, you probably logged in through OAuth'
    )
  );

  kIjxUtils.promises().callAndForget(() =>
    queueJobs<EmailJobParams>(
      /** workspace ID */ undefined,
      /** parent job ID */ undefined,
      {
        createdBy: kSystemSessionAgent,
        type: kJobType.email,
        idempotencyToken: Date.now().toString(),
        params: {
          type: kEmailJobType.forgotPassword,
          emailAddress: [user.email],
          userId: [user.resourceId],
        },
      }
    )
  );
}

export default forgotPassword;

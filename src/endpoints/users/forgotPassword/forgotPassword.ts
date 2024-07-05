import {
  EmailJobParams,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {User} from '../../../definitions/user.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {validate} from '../../../utils/validate.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {assertUser} from '../utils.js';
import {ForgotPasswordEndpoint} from './types.js';
import {forgotPasswordJoiSchema} from './validation.js';

export const forgotPassword: ForgotPasswordEndpoint = async reqData => {
  const data = validate(reqData.data, forgotPasswordJoiSchema);
  const user = await kSemanticModels.user().getByEmail(data.email);
  assertUser(user);
  await INTERNAL_forgotPassword(user);
};

export async function INTERNAL_forgotPassword(user: User) {
  kUtilsInjectables.promises().forget(
    // queueEmailMessage(
    //   user.email,
    //   {type: kEmailMessageType.forgotPassword, params: {}},
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
          type: kEmailJobType.forgotPassword,
          emailAddress: [user.email],
          userId: [user.resourceId],
        },
      }
    )
  );
}

export default forgotPassword;

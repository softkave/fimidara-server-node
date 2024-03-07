import {EmailJobParams, kEmailJobType, kJobType} from '../../../definitions/job';
import {User} from '../../../definitions/user';
import {kSystemSessionAgent} from '../../../utils/agent';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {queueJobs} from '../../jobs/queueJobs';
import {assertUser} from '../utils';
import {ForgotPasswordEndpoint} from './types';
import {forgotPasswordJoiSchema} from './validation';

export const forgotPassword: ForgotPasswordEndpoint = async instData => {
  const data = validate(instData.data, forgotPasswordJoiSchema);
  const user = await kSemanticModels.user().getByEmail(data.email);
  assertUser(user);
  await INTERNAL_forgotPassword(user);
};

export async function INTERNAL_forgotPassword(user: User) {
  kUtilsInjectables.promises().forget(
    queueJobs<EmailJobParams>(
      /** workspace ID */ undefined,
      /** parent job ID */ undefined,
      {
        createdBy: kSystemSessionAgent,
        type: kJobType.email,
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

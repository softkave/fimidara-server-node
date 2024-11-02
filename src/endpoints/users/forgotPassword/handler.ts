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
import {validate} from '../../../utils/validate.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getUserFromSessionAgent} from '../utils/getUserFromSessionAgent.js';
import {ForgotPasswordEndpoint} from './types.js';
import {forgotPasswordJoiSchema} from './validation.js';

export const forgotPasswordEndpoint: ForgotPasswordEndpoint = async reqData => {
  const data = validate(reqData.data, forgotPasswordJoiSchema);
  const {agent, workspace} = await initEndpoint(reqData);
  const user = await kSemanticModels.utils().withTxn(async opts => {
    return await getUserFromSessionAgent(
      agent,
      /** params */ {
        workspaceId: workspace.resourceId,
        userId: data.userId,
        email: data.email,
      },
      opts
    );
  });

  kUtilsInjectables.promises().forget(
    queueJobs<EmailJobParams>(
      /** workspaceId */ workspace.resourceId,
      /** parentJobId */ undefined,
      /** jobsInput */ {
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
};

export default forgotPasswordEndpoint;

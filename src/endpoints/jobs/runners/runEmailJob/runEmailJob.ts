import {
  EmailBlocklist,
  kEmailBlocklistTrailType,
} from '../../../../definitions/email.js';
import {
  EmailJobParams,
  EmailJobType,
  Job,
  kEmailJobType,
} from '../../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {newResource} from '../../../../utils/resource.js';
import {AnyFn} from '../../../../utils/types.js';
import {EmailProviderSendEmailResult} from '../../../contexts/email/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {sendCollaborationRequestEmail} from './sendCollaborationRequestEmail.js';
import {sendCollaborationRequestResponseEmail} from './sendCollaborationRequestResponseEmail.js';
import {sendCollaborationRequestRevokedEmail} from './sendCollaborationRequestRevokedEmail.js';
import {sendConfirmEmailAddressEmail} from './sendConfirmEmailAddressEmail.js';
import {sendForgotPasswordEmail} from './sendForgotPasswordEmail.js';
import {sendUserUpgradedFromWaitlistEmail} from './sendUserUpgradedFromWaitlistEmail.js';

const kEmailJobTypeToHandlerMap: Record<
  EmailJobType,
  AnyFn<
    [/** jobId */ string, EmailJobParams],
    Promise<EmailProviderSendEmailResult | undefined>
  >
> = {
  [kEmailJobType.collaborationRequest]: sendCollaborationRequestEmail,
  [kEmailJobType.collaborationRequestExpired]:
    sendCollaborationRequestResponseEmail,
  [kEmailJobType.collaborationRequestResponse]:
    sendCollaborationRequestResponseEmail,
  [kEmailJobType.collaborationRequestRevoked]:
    sendCollaborationRequestRevokedEmail,
  [kEmailJobType.confirmEmailAddress]: sendConfirmEmailAddressEmail,
  [kEmailJobType.forgotPassword]: sendForgotPasswordEmail,
  [kEmailJobType.upgradedFromWaitlist]: sendUserUpgradedFromWaitlistEmail,
};

export async function runEmailJob(job: Pick<Job, 'params' | 'resourceId'>) {
  const params = job.params as EmailJobParams;
  const handler = kEmailJobTypeToHandlerMap[params.type];
  const result = await handler(job.resourceId, params);
  const blockEmailAddressList = result?.blockEmailAddressList || [];

  if (blockEmailAddressList.length) {
    kUtilsInjectables.promises().forget(
      kSemanticModels.utils().withTxn(async opts => {
        const blocklistItems = blockEmailAddressList.map(item => {
          return newResource<EmailBlocklist>(
            kFimidaraResourceType.emailBlocklist,
            {
              emailAddress: item.emailAddress,
              reason: item.reason,
              trail: {
                trailType: kEmailBlocklistTrailType.emailJob,
                jobId: job.resourceId,
              },
            }
          );
        });
        await kSemanticModels.emailBlocklist().insertItem(blocklistItems, opts);
      })
    );
  }

  if (result?.meta) {
    kUtilsInjectables.promises().forget(
      kSemanticModels.utils().withTxn(async opts => {
        await kSemanticModels
          .job()
          .updateOneById(job.resourceId, {meta: result?.meta}, opts);
      })
    );
  }
}

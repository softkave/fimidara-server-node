import {EmailBlocklist, kEmailBlocklistTrailType} from '../../../../definitions/email';
import {
  EmailJobParams,
  EmailJobType,
  Job,
  kEmailJobType,
} from '../../../../definitions/job';
import {kFimidaraResourceType} from '../../../../definitions/system';
import {newResource} from '../../../../utils/resource';
import {AnyFn} from '../../../../utils/types';
import {EmailProviderSendEmailResult} from '../../../contexts/email/types';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {sendCollaborationRequestEmail} from './sendCollaborationRequestEmail';
import {sendCollaborationRequestResponseEmail} from './sendCollaborationRequestResponseEmail';
import {sendCollaborationRequestRevokedEmail} from './sendCollaborationRequestRevokedEmail';
import {sendConfirmEmailAddressEmail} from './sendConfirmEmailAddressEmail';
import {sendForgotPasswordEmail} from './sendForgotPasswordEmail';
import {sendUserUpgradedFromWaitlistEmail} from './sendUserUpgradedFromWaitlistEmail';

const kEmailJobTypeToHandlerMap: Record<
  EmailJobType,
  AnyFn<
    [/** jobId */ string, EmailJobParams],
    Promise<EmailProviderSendEmailResult | undefined>
  >
> = {
  [kEmailJobType.collaborationRequest]: sendCollaborationRequestEmail,
  [kEmailJobType.collaborationRequestExpired]: sendCollaborationRequestResponseEmail,
  [kEmailJobType.collaborationRequestResponse]: sendCollaborationRequestResponseEmail,
  [kEmailJobType.collaborationRequestRevoked]: sendCollaborationRequestRevokedEmail,
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
          return newResource<EmailBlocklist>(kFimidaraResourceType.emailBlocklist, {
            emailAddress: item.emailAddress,
            reason: item.reason,
            trail: {trailType: kEmailBlocklistTrailType.emailJob, jobId: job.resourceId},
          });
        });
        await kSemanticModels.emailBlocklist().insertItem(blocklistItems, opts);
      }, /** reuseTxn */ false)
    );
  }

  if (result?.meta) {
    kUtilsInjectables.promises().forget(
      kSemanticModels.utils().withTxn(async opts => {
        await kSemanticModels
          .job()
          .updateOneById(job.resourceId, {meta: result?.meta}, opts);
      }, /** reuseTxn */ false)
    );
  }
}

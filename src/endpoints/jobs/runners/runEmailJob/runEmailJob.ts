import assert from 'assert';
import {EmailProviderSendEmailResult} from '../../../../contexts/email/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {
  EmailBlocklist,
  kEmailBlocklistTrailType,
} from '../../../../definitions/email.js';
import {
  EmailJobParams,
  EmailJobType,
  Job,
  kEmailJobType,
  kJobType,
} from '../../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {newResource} from '../../../../utils/resource.js';
import {AnyFn} from '../../../../utils/types.js';
import {sendCollaborationRequestEmail} from './sendCollaborationRequestEmail.js';
import {sendCollaborationRequestResponseEmail} from './sendCollaborationRequestResponseEmail.js';
import {sendCollaborationRequestRevokedEmail} from './sendCollaborationRequestRevokedEmail.js';
import {sendConfirmEmailAddressEmail} from './sendConfirmEmailAddressEmail.js';
import {sendForgotPasswordEmail} from './sendForgotPasswordEmail.js';
import {sendNewSignupsOnWaitlistEmail} from './sendNewSignupsOnWaitlistEmail.js';
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
  [kEmailJobType.newSignupsOnWaitlist]: sendNewSignupsOnWaitlistEmail,
};

export async function runEmailJob(
  job: Pick<Job, 'params' | 'resourceId' | 'type'>
) {
  assert(job.type === kJobType.email);

  const params = job.params as EmailJobParams;
  const handler = kEmailJobTypeToHandlerMap[params.type];
  const result = await handler(job.resourceId, params);
  const blockEmailAddressList = result?.blockEmailAddressList || [];

  if (blockEmailAddressList.length) {
    kIjxUtils.promises().callAndForget(() =>
      kIjxSemantic.utils().withTxn(async opts => {
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
        await kIjxSemantic.emailBlocklist().insertItem(blocklistItems, opts);
      })
    );
  }

  if (result?.meta) {
    kIjxUtils.promises().callAndForget(() =>
      kIjxSemantic.utils().withTxn(async opts => {
        await kIjxSemantic
          .job()
          .updateOneById(job.resourceId, {meta: result?.meta}, opts);
      })
    );
  }
}

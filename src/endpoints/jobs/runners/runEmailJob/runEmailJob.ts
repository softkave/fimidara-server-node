import {
  EmailJobParams,
  EmailJobType,
  Job,
  kEmailJobType,
} from '../../../../definitions/job';
import {AnyFn} from '../../../../utils/types';
import {sendCollaborationRequestResponseEmail} from './sendCollaborationRequestResponseEmail';
import {sendCollaborationRequestRevokedEmail} from './sendCollaborationRequestRevokedEmail';
import {sendConfirmEmailAddressEmail} from './sendConfirmEmailAddressEmail';
import {sendForgotPasswordEmail} from './sendForgotPasswordEmail';
import {sendUserUpgradedFromWaitlistEmail} from './sendUserUpgradedFromWaitlistEmail';

const kEmailJobTypeToHandlerMap: Record<
  EmailJobType,
  AnyFn<[EmailJobParams], Promise<void>>
> = {
  [kEmailJobType.collaborationRequest]: sendCollaborationRequestResponseEmail,
  [kEmailJobType.collaborationRequestExpired]: sendCollaborationRequestResponseEmail,
  [kEmailJobType.collaborationRequestResponse]: sendCollaborationRequestResponseEmail,
  [kEmailJobType.collaborationRequestRevoked]: sendCollaborationRequestRevokedEmail,
  [kEmailJobType.confirmEmailAddress]: sendConfirmEmailAddressEmail,
  [kEmailJobType.forgotPassword]: sendForgotPasswordEmail,
  [kEmailJobType.upgradedFromWaitlist]: sendUserUpgradedFromWaitlistEmail,
};

export async function runEmailJob(job: Pick<Job, 'params'>) {
  const params = job.params as EmailJobParams;
  const handler = kEmailJobTypeToHandlerMap[params.type];
  await handler(params);
}

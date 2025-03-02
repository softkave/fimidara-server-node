import {first} from 'lodash-es';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job.js';
import {
  CollaborationRequestRevokedEmailProps,
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
  kCollaborationRequestRevokedEmail,
} from '../../../../emailTemplates/collaborationRequestRevoked.js';
import {appAssert} from '../../../../utils/assertion.js';
import {getBaseEmailTemplateProps} from './utils.js';

export async function sendCollaborationRequestRevokedEmail(
  jobId: string,
  params: EmailJobParams
) {
  appAssert(
    params.type === kEmailJobType.collaborationRequestRevoked,
    `Email job type is not ${kEmailJobType.collaborationRequestRevoked}`
  );
  const {user, base, source} = await getBaseEmailTemplateProps(params);
  const recipientEmail = user?.email || first(params.emailAddress);

  if (!recipientEmail) {
    throw new Error(`No recipient email for job ${jobId}`);
  }

  const request = await kIjxSemantic
    .collaborationRequest()
    .getOneById(params.params.requestId);

  if (!request) {
    throw new Error(`Collaboration request not found for job ${jobId}`);
  }

  const workspace = await kIjxSemantic
    .workspace()
    .getOneById(request.workspaceId);

  if (!workspace) {
    throw new Error(`Workspace not found for job ${jobId}`);
  }

  const emailProps: CollaborationRequestRevokedEmailProps = {
    ...base,
    workspaceName: workspace.name,
  };
  const html = collaborationRequestRevokedEmailHTML(emailProps);
  const text = collaborationRequestRevokedEmailText(emailProps);
  return await kIjxUtils.email().sendEmail({
    source,
    subject: kCollaborationRequestRevokedEmail.title(workspace.name),
    body: {html, text},
    destination: params.emailAddress,
  });
}

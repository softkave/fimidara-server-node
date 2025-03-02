import {first} from 'lodash-es';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job.js';
import {
  CollaborationRequestEmailProps,
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
  kCollaborationRequestEmailArtifacts,
} from '../../../../emailTemplates/collaborationRequest.js';
import {appAssert} from '../../../../utils/assertion.js';
import {getBaseEmailTemplateProps} from './utils.js';

export async function sendCollaborationRequestEmail(
  jobId: string,
  params: EmailJobParams
) {
  appAssert(
    params.type === kEmailJobType.collaborationRequest,
    `Email job type is not ${kEmailJobType.collaborationRequest}`
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

  const emailProps: CollaborationRequestEmailProps = {
    ...base,
    isRecipientAUser: !!user,
    workspaceName: workspace.name,
    expires: request.expiresAt,
    message: request.message,
  };
  const html = collaborationRequestEmailHTML(emailProps);
  const text = collaborationRequestEmailText(emailProps);
  return await kIjxUtils.email().sendEmail({
    source,
    subject: kCollaborationRequestEmailArtifacts.title(workspace.name),
    body: {html, text},
    destination: params.emailAddress,
  });
}

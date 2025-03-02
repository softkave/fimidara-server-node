import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {CollaborationRequestResponse} from '../../../../definitions/collaborationRequest.js';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job.js';
import {
  CollaborationRequestResponseEmailProps,
  collaborationRequestResponseEmailHTML,
  collaborationRequestResponseEmailText,
  kCollaborationRequestResponseArtifacts,
} from '../../../../emailTemplates/collaborationRequestResponse.js';
import {appAssert} from '../../../../utils/assertion.js';
import {getBaseEmailTemplateProps} from './utils.js';

export async function sendCollaborationRequestResponseEmail(
  jobId: string,
  params: EmailJobParams
) {
  appAssert(
    params.type === kEmailJobType.collaborationRequestResponse,
    `Email job type is not ${kEmailJobType.collaborationRequestResponse}`
  );
  const [{user, base, source}, request] = await Promise.all([
    getBaseEmailTemplateProps(params),
    kIjxSemantic.collaborationRequest().getOneById(params.params.requestId),
  ]);

  if (!request) {
    throw new Error(`Collaboration request not found for job ${jobId}`);
  }

  if (!user) {
    throw new Error(`User not found for job ${jobId}`);
  }

  const workspace = await kIjxSemantic
    .workspace()
    .getOneById(request.workspaceId);

  if (!workspace) {
    throw new Error(`Workspace not found for job ${jobId}`);
  }

  const emailProps: CollaborationRequestResponseEmailProps = {
    ...base,
    recipientEmail: request.recipientEmail,
    response: request.status as CollaborationRequestResponse,
    workspaceName: workspace.name,
  };
  const html = collaborationRequestResponseEmailHTML(emailProps);
  const text = collaborationRequestResponseEmailText(emailProps);

  return await kIjxUtils.email().sendEmail({
    source,
    subject: kCollaborationRequestResponseArtifacts.title(emailProps),
    body: {html, text},
    destination: params.emailAddress,
  });
}

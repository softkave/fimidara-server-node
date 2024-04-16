import {CollaborationRequestResponse} from '../../../../definitions/collaborationRequest';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job';
import {
  CollaborationRequestResponseEmailProps,
  collaborationRequestResponseEmailHTML,
  collaborationRequestResponseEmailText,
  kCollaborationRequestResponseArtifacts,
} from '../../../../emailTemplates/collaborationRequestResponse';
import {appAssert} from '../../../../utils/assertion';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {getBaseEmailTemplateProps} from './utils';

export async function sendCollaborationRequestResponseEmail(
  jobId: string,
  params: EmailJobParams
) {
  appAssert(params.type === kEmailJobType.collaborationRequestResponse);
  const [{user, base, source}, request] = await Promise.all([
    getBaseEmailTemplateProps(params),
    kSemanticModels.collaborationRequest().getOneById(params.params.requestId),
  ]);

  if (!request) {
    throw new Error(`Collaboration request not found for job ${jobId}`);
  }

  if (!user) {
    throw new Error(`User not found for job ${jobId}`);
  }

  const workspace = await kSemanticModels.workspace().getOneById(request.workspaceId);

  if (!workspace) {
    throw new Error(`Workspace not found for job ${jobId}`);
  }

  const emailProps: CollaborationRequestResponseEmailProps = {
    ...base,
    recipientEmail: user.email,
    response: request.status as CollaborationRequestResponse,
    workspaceName: workspace.name,
  };
  const html = collaborationRequestResponseEmailHTML(emailProps);
  const text = collaborationRequestResponseEmailText(emailProps);
  return await kUtilsInjectables.email().sendEmail({
    source,
    subject: kCollaborationRequestResponseArtifacts.title(emailProps),
    body: {html, text},
    destination: params.emailAddress,
  });
}

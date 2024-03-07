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

export async function sendCollaborationRequestResponseEmail(params: EmailJobParams) {
  appAssert(params.type === kEmailJobType.collaborationRequestResponse);
  const [{user, base, source}, request] = await Promise.all([
    getBaseEmailTemplateProps(params),
    kSemanticModels.collaborationRequest().getOneById(params.params.requestId),
  ]);

  if (!request || !user) {
    return;
  }

  const workspace = await kSemanticModels.workspace().getOneById(request.workspaceId);

  if (!workspace) {
    return;
  }

  const emailProps: CollaborationRequestResponseEmailProps = {
    ...base,
    recipientEmail: user.email,
    response: request.status as CollaborationRequestResponse,
    workspaceName: workspace.name,
  };
  const html = collaborationRequestResponseEmailHTML(emailProps);
  const text = collaborationRequestResponseEmailText(emailProps);
  await kUtilsInjectables.email().sendEmail({
    source,
    subject: kCollaborationRequestResponseArtifacts.title(emailProps),
    body: {html, text},
    destination: params.emailAddress,
  });
}

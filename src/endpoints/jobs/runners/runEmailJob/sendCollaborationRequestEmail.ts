import {first} from 'lodash';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job';
import {
  CollaborationRequestEmailProps,
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
  kCollaborationRequestEmailArtifacts,
} from '../../../../emailTemplates/collaborationRequest';
import {appAssert} from '../../../../utils/assertion';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {getBaseEmailTemplateProps} from './utils';

export async function sendCollaborationRequestEmail(params: EmailJobParams) {
  appAssert(params.type === kEmailJobType.collaborationRequest);
  const {user, base, source} = await getBaseEmailTemplateProps(params);
  const recipientEmail = user?.email || first(params.emailAddress);

  if (!recipientEmail) {
    return;
  }

  const request = await kSemanticModels
    .collaborationRequest()
    .getOneById(params.params.requestId);

  if (!request) {
    return;
  }

  const workspace = await kSemanticModels.workspace().getOneById(request.workspaceId);

  if (!workspace) {
    return;
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
  await kUtilsInjectables.email().sendEmail({
    source,
    subject: kCollaborationRequestEmailArtifacts.title(workspace.name),
    body: {html, text},
    destination: params.emailAddress,
  });
}

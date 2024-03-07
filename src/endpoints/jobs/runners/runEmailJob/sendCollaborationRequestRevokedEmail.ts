import {first} from 'lodash';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job';
import {
  CollaborationRequestRevokedEmailProps,
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
  kCollaborationRequestRevokedEmail,
} from '../../../../emailTemplates/collaborationRequestRevoked';
import {appAssert} from '../../../../utils/assertion';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {getBaseEmailTemplateProps} from './utils';

export async function sendCollaborationRequestRevokedEmail(params: EmailJobParams) {
  appAssert(params.type === kEmailJobType.collaborationRequestRevoked);
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

  const emailProps: CollaborationRequestRevokedEmailProps = {
    ...base,
    workspaceName: workspace.name,
  };
  const html = collaborationRequestRevokedEmailHTML(emailProps);
  const text = collaborationRequestRevokedEmailText(emailProps);
  await kUtilsInjectables.email().sendEmail({
    source,
    subject: kCollaborationRequestRevokedEmail.title(workspace.name),
    body: {html, text},
    destination: params.emailAddress,
  });
}

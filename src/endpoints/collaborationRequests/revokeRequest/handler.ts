import {
  CollaborationRequest,
  CollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest';
import {
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
  kCollaborationRequestRevokedEmail,
} from '../../../emailTemplates/collaborationRequestRevoked';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {InvalidRequestError} from '../../errors';
import {
  assertCollaborationRequest,
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils';
import {RevokeCollaborationRequestEndpoint} from './types';
import {revokeCollaborationRequestJoiSchema} from './validation';

const revokeCollaborationRequest: RevokeCollaborationRequestEndpoint = async instData => {
  const data = validate(instData.data, revokeCollaborationRequestJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);

  const {request, workspace} = await kSemanticModels.utils().withTxn(async opts => {
    const {request, workspace} = await checkCollaborationRequestAuthorization02(
      agent,
      data.requestId,
      'revokeCollaborationRequest',
      opts
    );

    const isRevoked = request.status === CollaborationRequestStatusTypeMap.Revoked;
    appAssert(
      isRevoked === false,
      new InvalidRequestError('Collaboration request already revoked')
    );
    const updatedRequest = await kSemanticModels
      .collaborationRequest()
      .getAndUpdateOneById(
        data.requestId,
        {statusDate: getTimestamp(), status: CollaborationRequestStatusTypeMap.Revoked},
        opts
      );

    assertCollaborationRequest(updatedRequest);
    return {workspace, request: updatedRequest};
  });

  // TODO: fire and forget
  await sendRevokeCollaborationRequestEmail(request, workspace.name);
  return {request: collaborationRequestForWorkspaceExtractor(request)};
};

async function sendRevokeCollaborationRequestEmail(
  request: CollaborationRequest,
  workspaceName: string
) {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.clientLoginLink);
  appAssert(suppliedConfig.clientSignupLink);
  appAssert(suppliedConfig.appDefaultEmailAddressFrom);

  const recipient = await kSemanticModels.user().getByEmail(request.recipientEmail);
  const signupLink = suppliedConfig.clientSignupLink;
  const loginLink = suppliedConfig.clientLoginLink;
  const html = collaborationRequestRevokedEmailHTML({
    workspaceName,
    signupLink,
    loginLink,
    firstName: recipient?.firstName,
  });
  const text = collaborationRequestRevokedEmailText({
    workspaceName,
    signupLink,
    loginLink,
    firstName: recipient?.firstName,
  });
  await kUtilsInjectables.email().sendEmail({
    subject: kCollaborationRequestRevokedEmail.title(workspaceName),
    body: {html, text},
    destination: [request.recipientEmail],
    source: suppliedConfig.appDefaultEmailAddressFrom,
  });
}

export default revokeCollaborationRequest;

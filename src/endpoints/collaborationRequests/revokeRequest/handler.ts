import {
  CollaborationRequest,
  CollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest';
import {
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
  collaborationRequestRevokedEmailTitle,
} from '../../../emailTemplates/collaborationRequestRevoked';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {BaseContextType} from '../../contexts/types';
import {InvalidRequestError} from '../../errors';
import {
  assertCollaborationRequest,
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils';
import {RevokeCollaborationRequestEndpoint} from './types';
import {revokeCollaborationRequestJoiSchema} from './validation';

const revokeCollaborationRequest: RevokeCollaborationRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, revokeCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {request, workspace} = await context.semantic.utils.withTxn(
    context,
    async opts => {
      const {request, workspace} = await checkCollaborationRequestAuthorization02(
        context,
        agent,
        data.requestId,
        'revokeCollaborationRequest',
        opts
      );

      const isRevoked = request.status === CollaborationRequestStatusTypeMap.Revoked;
      appAssert(
        isRevoked === false,
        new InvalidRequestError('Collaboration request already revoked.')
      );
      const updatedRequest =
        await context.semantic.collaborationRequest.getAndUpdateOneById(
          data.requestId,
          {statusDate: getTimestamp(), status: CollaborationRequestStatusTypeMap.Revoked},
          opts
        );

      assertCollaborationRequest(updatedRequest);
      return {workspace, request: updatedRequest};
    }
  );

  // TODO: fire and forget
  await sendRevokeCollaborationRequestEmail(context, request, workspace.name);
  return {request: collaborationRequestForWorkspaceExtractor(request)};
};

async function sendRevokeCollaborationRequestEmail(
  context: BaseContextType,
  request: CollaborationRequest,
  workspaceName: string
) {
  const recipient = await context.semantic.user.getByEmail(request.recipientEmail);
  const signupLink = context.appVariables.clientSignupLink;
  const loginLink = context.appVariables.clientLoginLink;
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
  await context.email.sendEmail(context, {
    subject: collaborationRequestRevokedEmailTitle(workspaceName),
    body: {html, text},
    destination: [request.recipientEmail],
    source: context.appVariables.appDefaultEmailAddressFrom,
  });
}

export default revokeCollaborationRequest;

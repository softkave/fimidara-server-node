import {
  CollaborationRequest,
  CollaborationRequestStatusType,
} from '../../../definitions/collaborationRequest';
import {AppActionType} from '../../../definitions/system';
import {
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
  collaborationRequestRevokedEmailTitle,
} from '../../../emailTemplates/collaborationRequestRevoked';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {MemStore} from '../../contexts/mem/Mem';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {InvalidRequestError} from '../../errors';
import {
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
  let {request, workspace} = await MemStore.withTransaction(context, async transaction => {
    const opts: SemanticDataAccessProviderMutationRunOptions = {transaction};
    let {request, workspace} = await checkCollaborationRequestAuthorization02(
      context,
      agent,
      data.requestId,
      AppActionType.Update,
      opts
    );

    const isRevoked = request.status === CollaborationRequestStatusType.Revoked;
    appAssert(
      isRevoked === false,
      new InvalidRequestError('Collaboration request already revoked.')
    );
    request = await context.semantic.collaborationRequest.getAndUpdateOneById(
      data.requestId,
      {statusDate: getTimestamp(), status: CollaborationRequestStatusType.Revoked},
      opts
    );

    return {request, workspace};
  });

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

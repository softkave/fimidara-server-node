import {
  CollaborationRequestStatusType,
  ICollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {BasicCRUDActions} from '../../../definitions/system';
import {
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
  collaborationRequestRevokedEmailTitle,
} from '../../../emailTemplates/collaborationRequestRevoked';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {IBaseContext} from '../../contexts/types';
import {assertWorkspace} from '../../workspaces/utils';
import {
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
  populateRequestAssignedPermissionGroups,
} from '../utils';
import {RevokeCollaborationRequestEndpoint} from './types';
import {revokeCollaborationRequestJoiSchema} from './validation';

const revokeCollaborationRequest: RevokeCollaborationRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, revokeCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {request} = await checkCollaborationRequestAuthorization02(
    context,
    agent,
    data.requestId,
    BasicCRUDActions.Update
  );

  const isRevoked = request.status === CollaborationRequestStatusType.Revoked;
  if (!isRevoked) {
    request = await context.semantic.collaborationRequest.getAndUpdateOneById(data.requestId, {
      statusDate: getTimestamp(),
      status: CollaborationRequestStatusType.Revoked,
    });

    const workspace = await context.semantic.workspace.getOneById(request.workspaceId);
    assertWorkspace(workspace);
    if (workspace) {
      await sendRevokeCollaborationRequestEmail(context, request, workspace.name);
    }
  }

  request = await populateRequestAssignedPermissionGroups(context, request);
  return {
    request: collaborationRequestForWorkspaceExtractor(request),
  };
};

async function sendRevokeCollaborationRequestEmail(
  context: IBaseContext,
  request: ICollaborationRequest,
  workspaceName: string
) {
  const signupLink = context.appVariables.clientSignupLink;
  const loginLink = context.appVariables.clientLoginLink;
  const html = collaborationRequestRevokedEmailHTML({
    workspaceName,
    signupLink,
    loginLink,
  });
  const text = collaborationRequestRevokedEmailText({
    workspaceName,
    signupLink,
    loginLink,
  });
  await context.email.sendEmail(context, {
    subject: collaborationRequestRevokedEmailTitle(workspaceName),
    body: {html, text},
    destination: [request.recipientEmail],
    source: context.appVariables.appDefaultEmailAddressFrom,
  });
}

export default revokeCollaborationRequest;

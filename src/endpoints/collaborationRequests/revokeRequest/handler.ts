import {
  CollaborationRequestStatusType,
  ICollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {BasicCRUDActions} from '../../../definitions/system';
import {
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
  collaborationRequestRevokedEmailTitle,
} from '../../../email-templates/collaborationRequestRevoked';
import {getDateString} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {assertWorkspace} from '../../workspaces/utils';
import {
  checkCollaborationRequestAuthorization02,
  collaborationRequestExtractor,
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

  const status = request.statusHistory[request.statusHistory.length - 1];
  const isRevoked = status.status === CollaborationRequestStatusType.Revoked;

  if (!isRevoked) {
    request = await context.data.collaborationRequest.assertGetAndUpdateOneByQuery(
      EndpointReusableQueries.getByResourceId(data.requestId),
      {
        statusHistory: request.statusHistory.concat({
          date: getDateString(),
          status: CollaborationRequestStatusType.Revoked,
        }),
      }
    );

    const workspace = await context.data.workspace.getOneByQuery(
      EndpointReusableQueries.getByResourceId(request.workspaceId)
    );
    assertWorkspace(workspace);
    if (workspace) {
      await sendRevokeCollaborationRequestEmail(context, request, workspace.name);
    }
  }

  request = await populateRequestAssignedPermissionGroups(context, request);
  return {
    request: collaborationRequestExtractor(request),
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

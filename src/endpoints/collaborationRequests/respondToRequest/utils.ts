import {
  CollaborationRequest,
  CollaborationRequestResponse,
  CollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest';
import {AppResourceTypeMap, SessionAgent} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {
  CollaborationRequestResponseEmailProps,
  collaborationRequestResponseEmailHTML,
  collaborationRequestResponseEmailText,
  collaborationRequestResponseEmailTitle,
} from '../../../emailTemplates/collaborationRequestResponse';
import {appAssert} from '../../../utils/assertion';
import {formatDate, getTimestamp} from '../../../utils/dateFns';
import {ServerStateConflictError} from '../../../utils/errors';
import {isStringEqual} from '../../../utils/fns';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {PermissionDeniedError} from '../../users/errors';
import {assertUser} from '../../users/utils';
import {assertWorkspace} from '../../workspaces/utils';
import {assertCollaborationRequest} from '../utils';
import {RespondToCollaborationRequestEndpointParams} from './types';

async function sendCollaborationRequestResponseEmail(
  context: BaseContextType,
  request: CollaborationRequest,
  response: CollaborationRequestResponse,
  toUser: User
) {
  const emailProps: CollaborationRequestResponseEmailProps = {
    response,
    workspaceName: request.workspaceName,
    loginLink: context.appVariables.clientLoginLink,
    signupLink: context.appVariables.clientSignupLink,
    recipientEmail: request.recipientEmail,
    firstName: toUser?.firstName,
  };
  const html = collaborationRequestResponseEmailHTML(emailProps);
  const text = collaborationRequestResponseEmailText(emailProps);
  await context.email.sendEmail(context, {
    subject: collaborationRequestResponseEmailTitle(emailProps),
    body: {html, text},
    destination: [toUser.email],
    source: context.appVariables.appDefaultEmailAddressFrom,
  });
}

export const INTERNAL_RespondToCollaborationRequest = async (
  context: BaseContextType,
  agent: SessionAgent,
  data: RespondToCollaborationRequestEndpointParams,
  opts: SemanticProviderMutationRunOptions
) => {
  const request = await context.semantic.collaborationRequest.getOneById(
    data.requestId,
    opts
  );
  assertCollaborationRequest(request);
  const user = agent.user;
  assertUser(user);
  appAssert(
    isStringEqual(user.email, request.recipientEmail),
    new PermissionDeniedError('User is not the collaboration request recipient.')
  );

  const isExpired =
    request.expiresAt && new Date(request.expiresAt).valueOf() < Date.now();
  const isAccepted = data.response === CollaborationRequestStatusTypeMap.Accepted;

  if (isExpired) {
    throw new ServerStateConflictError(
      `Collaboration request expired on ${formatDate(request.expiresAt!)}.`
    );
  }

  const [updatedRequest] = await Promise.all([
    context.semantic.collaborationRequest.getAndUpdateOneById(
      data.requestId,
      {statusDate: getTimestamp(), status: data.response},
      opts
    ),
    isAccepted &&
      assignWorkspaceToUser(
        context,
        request.createdBy,
        request.workspaceId,
        user.resourceId,
        opts
      ),
  ]);

  assertCollaborationRequest(updatedRequest);
  return updatedRequest;
};

export async function notifyUserOnCollaborationRequestResponse(
  context: BaseContextType,
  request: CollaborationRequest,
  response: CollaborationRequestResponse
) {
  const workspace = await context.semantic.workspace.getOneById(request.workspaceId);
  assertWorkspace(workspace);
  const notifyUser =
    request.createdBy.agentType === AppResourceTypeMap.User ||
    workspace.createdBy.agentType === AppResourceTypeMap.User
      ? // TODO: check if agent is a user or associated type before fetching
        await context.semantic.user.getOneById(
          request.createdBy.agentType === AppResourceTypeMap.User
            ? request.createdBy.agentId
            : workspace.createdBy.agentId
        )
      : null;

  if (notifyUser && notifyUser.isEmailVerified) {
    await sendCollaborationRequestResponseEmail(context, request, response, notifyUser);
  }
}

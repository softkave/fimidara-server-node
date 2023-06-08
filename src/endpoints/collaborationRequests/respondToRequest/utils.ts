import {
  CollaborationRequest,
  CollaborationRequestResponse,
  CollaborationRequestStatusType,
} from '../../../definitions/collaborationRequest';
import {AppResourceType, SessionAgent} from '../../../definitions/system';
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
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
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

export const internalRespondToCollaborationRequest = async (
  context: BaseContextType,
  agent: SessionAgent,
  data: RespondToCollaborationRequestEndpointParams,
  opts: SemanticDataAccessProviderMutationRunOptions
) => {
  let request = await context.semantic.collaborationRequest.getOneById(data.requestId, opts);
  assertCollaborationRequest(request);
  const user = agent.user;
  assertUser(user);
  appAssert(
    user.email === request.recipientEmail,
    new PermissionDeniedError('User is not the collaboration request recipient')
  );

  const isExpired = request.expiresAt && new Date(request.expiresAt).valueOf() < Date.now();
  const isAccepted = data.response === CollaborationRequestStatusType.Accepted;

  if (isExpired) {
    throw new ServerStateConflictError(
      `Collaboration request expired on ${formatDate(request.expiresAt!)}`
    );
  }

  [request] = await Promise.all([
    context.semantic.collaborationRequest.getAndUpdateOneById(
      data.requestId,
      {statusDate: getTimestamp(), status: data.response},
      opts
    ),
    isAccepted &&
      assignWorkspaceToUser(context, request.createdBy, request.workspaceId, user.resourceId, opts),
  ]);

  return request;
};

export async function notifyUserOnCollaborationRequestResponse(
  context: BaseContextType,
  request: CollaborationRequest,
  response: CollaborationRequestResponse
) {
  const workspace = await context.semantic.workspace.getOneById(request.workspaceId);
  assertWorkspace(workspace);
  const notifyUser =
    request.createdBy.agentType === AppResourceType.User ||
    workspace.createdBy.agentType === AppResourceType.User
      ? // TODO: check if agent is a user or associated type before fetching
        await context.semantic.user.getOneById(
          request.createdBy.agentType === AppResourceType.User
            ? request.createdBy.agentId
            : workspace.createdBy.agentId
        )
      : null;

  if (notifyUser && notifyUser.isEmailVerified) {
    await sendCollaborationRequestResponseEmail(context, request, response, notifyUser);
  }
}

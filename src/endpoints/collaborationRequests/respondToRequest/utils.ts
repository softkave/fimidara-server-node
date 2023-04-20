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
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../assignedItems/addAssignedItems';
import {getResourceAssignedItems} from '../../assignedItems/getAssignedItems';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContext} from '../../contexts/types';
import {PermissionDeniedError} from '../../user/errors';
import {assertUser} from '../../user/utils';
import {assertWorkspace} from '../../workspaces/utils';
import {assertCollaborationRequest} from '../utils';
import {RespondToCollaborationRequestEndpointParams} from './types';

async function sendCollaborationRequestResponseEmail(
  context: BaseContext,
  request: CollaborationRequest,
  response: CollaborationRequestResponse,
  toUser: Pick<User, 'email'>
) {
  const emailProps: CollaborationRequestResponseEmailProps = {
    response,
    workspaceName: request.workspaceName,
    loginLink: context.appVariables.clientLoginLink,
    signupLink: context.appVariables.clientSignupLink,
    recipientEmail: request.recipientEmail,
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

async function assignUserRequestPermissionGroups(
  context: BaseContext,
  agent: SessionAgent,
  workspaceId: string,
  requestId: string,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const permissionGroupsOnAccept = await getResourceAssignedItems(
    context,
    workspaceId,
    requestId,
    undefined,
    opts
  );

  if (permissionGroupsOnAccept.length > 0) {
    await addAssignedPermissionGroupList(
      context,
      agent,
      workspaceId,
      permissionGroupsOnAccept.map(item => ({permissionGroupId: item.assignedItemId})),
      agent.agentId,
      /** deleteExisting */ false,
      /** skipPermissionGroupsExistCheck */ true,
      /** skip auth check */ false,
      opts
    );
  }
}

export const internalRespondToCollaborationRequest = async (
  context: BaseContext,
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
  appAssert(
    isExpired === false,
    new ServerStateConflictError(
      `Collaboration request expired on ${formatDate(request.expiresAt!)}`
    )
  );

  [request] = await Promise.all([
    context.semantic.collaborationRequest.getAndUpdateOneById(
      data.requestId,
      {statusDate: getTimestamp(), status: data.response},
      opts
    ),
    isAccepted &&
      assignWorkspaceToUser(context, request.createdBy, request.workspaceId, user.resourceId, opts),
    isAccepted &&
      assignUserRequestPermissionGroups(
        context,
        agent,
        request.workspaceId,
        request.resourceId,
        opts
      ),
  ]);

  return request;
};

export async function notifyUserOnCollaborationRequestResponse(
  context: BaseContext,
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
    await sendCollaborationRequestResponseEmail(context, request, response, {
      email: notifyUser.email,
    });
  }
}

import {
  CollaborationRequestResponse,
  CollaborationRequestStatusType,
  ICollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {AppResourceType} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {IWorkspace} from '../../../definitions/workspace';
import {
  collaborationRequestResponseEmailHTML,
  collaborationRequestResponseEmailText,
  collaborationRequestResponseEmailTitle,
  ICollaborationRequestResponseEmailProps,
} from '../../../email-templates/collaborationRequestResponse';
import {formatDate, getTimestamp} from '../../../utils/dateFns';
import {ServerStateConflictError} from '../../../utils/errors';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../assignedItems/addAssignedItems';
import {getResourceAssignedItems} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {assertWorkspace} from '../../workspaces/utils';
import {IRespondToCollaborationRequestEndpointParams} from './types';

async function sendResponseEmail(
  context: IBaseContext,
  request: ICollaborationRequest,
  response: CollaborationRequestResponse,
  toUser: Pick<IUser, 'email'>
) {
  const emailProps: ICollaborationRequestResponseEmailProps = {
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
  context: IBaseContext,
  user: IUser,
  workspace: IWorkspace,
  request: ICollaborationRequest
) {
  const permissionGroupsOnAccept = await getResourceAssignedItems(
    context,
    request.workspaceId,
    request.resourceId
  );

  if (permissionGroupsOnAccept.length > 0) {
    await addAssignedPermissionGroupList(
      context,
      makeUserSessionAgent(user),
      workspace.resourceId,
      permissionGroupsOnAccept.map(item => ({permissionGroupId: item.assignedItemId})),
      user.resourceId,
      /** deleteExisting */ false,
      /** skipPermissionGroupsExistCheck */ true
    );
  }
}

/**
 * For internal use only.
 */
export const internalRespondToCollaborationRequest = async (
  context: IBaseContext,
  user: IUser,
  data: IRespondToCollaborationRequestEndpointParams
) => {
  let request = await context.data.collaborationRequest.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(data.requestId)
  );

  if (user.email !== request.recipientEmail) {
    throw new PermissionDeniedError('User is not the collaboration request recipient');
  }

  const isExpired = request.expiresAt && new Date(request.expiresAt).valueOf() < Date.now();
  if (isExpired && request.expiresAt) {
    throw new ServerStateConflictError(
      `Collaboration request expired on ${formatDate(request.expiresAt)}`
    );
  }

  request = await context.semantic.collaborationRequest.getAndUpdateOneById(data.requestId, {
    statusHistory: request.statusHistory.concat({
      date: getTimestamp(),
      status: data.response,
    }),
  });

  const workspace = await context.data.workspace.getOneByQuery(
    EndpointReusableQueries.getByResourceId(request.workspaceId)
  );
  assertWorkspace(workspace);
  const notifyUser =
    request.createdBy.agentType === AppResourceType.User ||
    workspace.createdBy.agentType === AppResourceType.User
      ? // TODO: check if agent is a user or associated type before fetching
        await context.data.user.assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(
            request.createdBy.agentType === AppResourceType.User
              ? request.createdBy.agentId
              : workspace.createdBy.agentId
          )
        )
      : null;

  if (notifyUser && notifyUser.isEmailVerified) {
    await sendResponseEmail(context, request, data.response, {
      email: notifyUser.email,
    });
  }
  if (data.response === CollaborationRequestStatusType.Accepted) {
    await assignWorkspaceToUser(context, request.createdBy, request.workspaceId, user);
    await assignUserRequestPermissionGroups(context, user, workspace, request);
  }

  return request;
};

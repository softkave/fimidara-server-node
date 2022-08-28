import {IAssignedPermissionGroupMeta} from '../../../definitions/assignedItem';
import {
  CollaborationRequestResponse,
  CollaborationRequestStatusType,
  ICollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {IWorkspace} from '../../../definitions/workspace';
import {
  collaborationRequestResponseEmailHTML,
  collaborationRequestResponseEmailText,
  collaborationRequestResponseEmailTitle,
  ICollaborationRequestResponseEmailProps,
} from '../../../email-templates/collaborationRequestResponse';
import {formatDate, getDateString} from '../../../utilities/dateFns';
import {ServerStateConflictError} from '../../../utilities/errors';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../assignedItems/addAssignedItems';
import {getResourceAssignedItems} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {assertWorkspace} from '../../workspaces/utils';
import {IRespondToRequestEndpointParams} from './types';

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
    request.resourceId,
    AppResourceType.CollaborationRequest
  );

  if (permissionGroupsOnAccept.length > 0) {
    await addAssignedPermissionGroupList(
      context,
      {
        agentId: user.resourceId,
        agentType: SessionAgentType.User,
      },
      workspace,
      permissionGroupsOnAccept.map(item => ({
        permissionGroupId: item.assignedItemId,
        order: (item.meta as IAssignedPermissionGroupMeta)?.order || 1,
      })),
      user.resourceId,
      AppResourceType.User,
      /** deleteExisting */ false,
      /** skipPermissionGroupsCheck */ true
    );
  }
}

/**
 * For internal use only.
 * @param context
 * @param instData
 * @returns
 */
export const internalRespondToRequest = async (
  context: IBaseContext,
  user: IUser,
  data: IRespondToRequestEndpointParams
) => {
  let request = await context.data.collaborationRequest.assertGetItem(
    EndpointReusableQueries.getById(data.requestId)
  );

  if (user.email !== request.recipientEmail) {
    throw new PermissionDeniedError(
      'User is not the collaboration request recipient'
    );
  }

  const isExpired =
    request.expiresAt && new Date(request.expiresAt).valueOf() < Date.now();

  if (isExpired && request.expiresAt) {
    throw new ServerStateConflictError(
      `Collaboration request expired on ${formatDate(request.expiresAt)}`
    );
  }

  request = await context.data.collaborationRequest.assertUpdateItem(
    EndpointReusableQueries.getById(data.requestId),
    {
      statusHistory: request.statusHistory.concat({
        date: getDateString(),
        status: data.response,
      }),
    }
  );

  const workspace = await context.cacheProviders.workspace.getById(
    context,
    request.workspaceId
  );

  assertWorkspace(workspace);
  const notifyUser = await context.data.user.assertGetItem(
    EndpointReusableQueries.getById(
      request.createdBy.agentType === SessionAgentType.User
        ? request.createdBy.agentId
        : workspace.createdBy.agentId
    )
  );

  if (notifyUser.isEmailVerified) {
    fireAndForgetPromise(
      sendResponseEmail(context, request, data.response, {
        email: notifyUser.email,
      })
    );
  }

  if (data.response === CollaborationRequestStatusType.Accepted) {
    await assignWorkspaceToUser(
      context,
      request.createdBy,
      request.workspaceId,
      user
    );

    await assignUserRequestPermissionGroups(context, user, workspace, request);
  }

  return request;
};

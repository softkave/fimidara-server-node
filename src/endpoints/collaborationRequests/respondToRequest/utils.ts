import {IAssignedPermissionGroupMeta} from '../../../definitions/assignedItem';
import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {formatDate, getDateString} from '../../../utilities/dateFns';
import {ServerStateConflictError} from '../../../utilities/errors';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../assignedItems/addAssignedItems';
import {getResourceAssignedItems} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {assertWorkspace} from '../../workspaces/utils';
import {IRespondToRequestEndpointParams} from './types';

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

  if (data.response === CollaborationRequestStatusType.Accepted) {
    await assignWorkspaceToUser(
      context,
      request.createdBy,
      request.workspaceId,
      user
    );

    const permissionGroupsOnAccept = await getResourceAssignedItems(
      context,
      request.workspaceId,
      request.resourceId,
      AppResourceType.CollaborationRequest
    );

    if (permissionGroupsOnAccept.length > 0) {
      const workspace = await context.cacheProviders.workspace.getById(
        context,
        request.workspaceId
      );

      assertWorkspace(workspace);
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

  return request;
};

import {
  ICollaborationRequest,
  ICollaborationRequestStatus,
  IPublicCollaborationRequest,
} from '../../definitions/collaborationRequest';
import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {getDateString, getDateStringIfPresent} from '../../utils/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import {fetchEntityAssignedPermissionGroupList} from '../permissionGroups/getEntityAssignedPermissionGroups/utils';
import {assignedPermissionGroupsListExtractor} from '../permissionGroups/utils';
import EndpointReusableQueries from '../queries';
import {agentExtractor} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';

const userCollaborationRequestFields = getFields<IPublicCollaborationRequest>(
  {
    resourceId: true,
    recipientEmail: true,
    message: true,
    createdBy: agentExtractor,
    createdAt: getDateString,
    expiresAt: getDateStringIfPresent,
    workspaceId: true,
    workspaceName: true,
    lastUpdatedAt: getDateString,
    lastUpdatedBy: agentExtractor,
    readAt: getDateStringIfPresent,
    statusHistory: makeListExtract(
      getFields<ICollaborationRequestStatus>({
        status: true,
        date: getDateString,
      })
    ),
    permissionGroupsAssignedOnAcceptingRequest: data =>
      data ? assignedPermissionGroupsListExtractor(data) : [],
  },
  req => {
    if (!req.permissionGroupsAssignedOnAcceptingRequest) {
      req.permissionGroupsAssignedOnAcceptingRequest = [];
    }

    return req;
  }
);

export async function checkCollaborationRequestAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  request: ICollaborationRequest,
  action: BasicCRUDActions,
  nothrow = false
) {
  const workspace = await checkWorkspaceExists(context, request.workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    action,
    nothrow,
    targetId: request.resourceId,
    type: AppResourceType.CollaborationRequest,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
  });

  return {agent, request, workspace};
}

export async function checkCollaborationRequestAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  requestId: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const request = await context.data.collaborationRequest.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(requestId)
  );
  return checkCollaborationRequestAuthorization(context, agent, request, action, nothrow);
}

export const collaborationRequestExtractor = makeExtract(userCollaborationRequestFields);
export const collaborationRequestListExtractor = makeListExtract(userCollaborationRequestFields);

export function throwCollaborationRequestNotFound() {
  throw new NotFoundError('Collaboration request not found');
}

export async function populateRequestAssignedPermissionGroups(
  context: IBaseContext,
  request: ICollaborationRequest
): Promise<IPublicCollaborationRequest> {
  const {immediatelyAssignedPermissionGroupsMeta} = await fetchEntityAssignedPermissionGroupList(
    context,
    request.workspaceId,
    request.resourceId,
    false
  );
  return {
    ...request,
    permissionGroupsAssignedOnAcceptingRequest: immediatelyAssignedPermissionGroupsMeta,
  };
}

export async function populateRequestListPermissionGroups(
  context: IBaseContext,
  requests: ICollaborationRequest[]
) {
  return await Promise.all(
    requests.map(request => populateRequestAssignedPermissionGroups(context, request))
  );
}

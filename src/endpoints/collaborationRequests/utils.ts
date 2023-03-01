import {
  ICollaborationRequest,
  ICollaborationRequestStatus,
  IPublicCollaborationRequestForUser,
  IPublicCollaborationRequestForWorkspace,
} from '../../definitions/collaborationRequest';
import {BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {reuseableErrors} from '../../utils/reusableErrors';
import {checkAuthorization} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import {assignedPermissionGroupsListExtractor} from '../permissionGroups/utils';
import EndpointReusableQueries from '../queries';
import {workspaceResourceFields} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';

const userCollaborationRequestForUserFields = getFields<IPublicCollaborationRequestForUser>({
  resourceId: true,
  recipientEmail: true,
  message: true,
  createdAt: true,
  expiresAt: true,
  workspaceName: true,
  lastUpdatedAt: true,
  readAt: true,
  statusHistory: makeListExtract(
    getFields<ICollaborationRequestStatus>({
      status: true,
      date: true,
    })
  ),
});

const userCollaborationRequestForWorkspaceFields =
  getFields<IPublicCollaborationRequestForWorkspace>(
    {
      ...workspaceResourceFields,
      recipientEmail: true,
      message: true,
      expiresAt: true,
      workspaceId: true,
      workspaceName: true,
      readAt: true,
      statusHistory: makeListExtract(
        getFields<ICollaborationRequestStatus>({
          status: true,
          date: true,
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
    action,
    nothrow,
    workspaceId: workspace.resourceId,
    targets: [{targetId: request.resourceId}],
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

export const collaborationRequestForUserExtractor = makeExtract(
  userCollaborationRequestForUserFields
);
export const collaborationRequestForUserListExtractor = makeListExtract(
  userCollaborationRequestForUserFields
);
export const collaborationRequestForWorkspaceExtractor = makeExtract(
  userCollaborationRequestForWorkspaceFields
);
export const collaborationRequestForWorkspaceListExtractor = makeListExtract(
  userCollaborationRequestForWorkspaceFields
);

export function throwCollaborationRequestNotFound() {
  throw new NotFoundError('Collaboration request not found');
}

export async function populateRequestAssignedPermissionGroups(
  context: IBaseContext,
  request: ICollaborationRequest
): Promise<IPublicCollaborationRequestForWorkspace> {
  const inheritanceMap = await context.semantic.permissions.getEntityInheritanceMap({
    context,
    entityId: request.resourceId,
    fetchDeep: false,
  });
  return {
    ...request,
    permissionGroupsAssignedOnAcceptingRequest: inheritanceMap[request.resourceId].items,
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

export function assertCollaborationRequest(
  request?: ICollaborationRequest | null
): asserts request {
  appAssert(request, reuseableErrors.collaborationRequest.notFound());
}

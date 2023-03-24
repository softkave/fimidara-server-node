import {
  ICollaborationRequest,
  IPublicCollaborationRequestForUser,
  IPublicCollaborationRequestForWorkspace,
} from '../../definitions/collaborationRequest';
import {IAssignedPermissionGroupMeta} from '../../definitions/permissionGroups';
import {AppActionType, ISessionAgent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {reuseableErrors} from '../../utils/reusableErrors';
import {checkAuthorization} from '../contexts/authorizationChecks/checkAuthorizaton';
import {ISemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
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
  status: true,
  statusDate: true,
});

const userCollaborationRequestForWorkspaceFields =
  getFields<IPublicCollaborationRequestForWorkspace>({
    ...workspaceResourceFields,
    recipientEmail: true,
    message: true,
    expiresAt: true,
    workspaceId: true,
    workspaceName: true,
    readAt: true,
    status: true,
    statusDate: true,
    // permissionGroupsAssignedOnAcceptingRequest: data =>
    //   data ? assignedPermissionGroupsListExtractor(data) : [],
  });

export async function checkCollaborationRequestAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  request: ICollaborationRequest,
  action: AppActionType
) {
  const workspace = await checkWorkspaceExists(context, request.workspaceId);
  await checkAuthorization({
    context,
    agent,
    action,
    workspaceId: workspace.resourceId,
    targets: [{targetId: request.resourceId}],
  });
  return {agent, request, workspace};
}

export async function checkCollaborationRequestAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  requestId: string,
  action: AppActionType,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const request = await context.semantic.collaborationRequest.getOneById(requestId, opts);
  assertCollaborationRequest(request);
  return checkCollaborationRequestAuthorization(context, agent, request, action);
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
): Promise<
  ICollaborationRequest & {
    permissionGroupsAssignedOnAcceptingRequest: IAssignedPermissionGroupMeta[];
  }
> {
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

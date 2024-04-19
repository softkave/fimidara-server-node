import {
  CollaborationRequest,
  PublicCollaborationRequestForUser,
  PublicCollaborationRequestForWorkspace,
} from '../../definitions/collaborationRequest';
import {AssignedPermissionGroupMeta} from '../../definitions/permissionGroups';
import {PermissionAction} from '../../definitions/permissionItem';
import {SessionAgent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {checkAuthorizationWithAgent} from '../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderOpParams} from '../contexts/semantic/types';
import {NotFoundError} from '../errors';
import {resourceFields, workspaceResourceFields} from '../extractors';

import {checkWorkspaceExists} from '../workspaces/utils';

const userCollaborationRequestForUserFields =
  getFields<PublicCollaborationRequestForUser>({
    ...resourceFields,
    recipientEmail: true,
    message: true,
    createdAt: true,
    expiresAt: true,
    workspaceName: true,
    readAt: true,
    status: true,
    statusDate: true,
  });

const userCollaborationRequestForWorkspaceFields =
  getFields<PublicCollaborationRequestForWorkspace>({
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
  agent: SessionAgent,
  request: CollaborationRequest,
  action: PermissionAction,
  opts?: SemanticProviderOpParams
) {
  const workspace = await checkWorkspaceExists(request.workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    opts,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    target: {action, targetId: request.resourceId},
  });
  return {agent, request, workspace};
}

export async function checkCollaborationRequestAuthorization02(
  agent: SessionAgent,
  requestId: string,
  action: PermissionAction,
  opts?: SemanticProviderOpParams
) {
  const request = await kSemanticModels
    .collaborationRequest()
    .getOneById(requestId, opts);
  assertCollaborationRequest(request);
  return checkCollaborationRequestAuthorization(agent, request, action);
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
  request: CollaborationRequest
): Promise<
  CollaborationRequest & {
    permissionGroupsAssignedOnAcceptingRequest: AssignedPermissionGroupMeta[];
  }
> {
  const inheritanceMap = await kSemanticModels.permissions().getEntityInheritanceMap({
    entityId: request.resourceId,
    fetchDeep: false,
  });
  return {
    ...request,
    permissionGroupsAssignedOnAcceptingRequest: inheritanceMap[request.resourceId].items,
  };
}

export async function populateRequestListPermissionGroups(
  requests: CollaborationRequest[]
) {
  return await Promise.all(
    requests.map(request => populateRequestAssignedPermissionGroups(request))
  );
}

export function assertCollaborationRequest(
  request?: CollaborationRequest | null
): asserts request {
  appAssert(request, kReuseableErrors.collaborationRequest.notFound());
}

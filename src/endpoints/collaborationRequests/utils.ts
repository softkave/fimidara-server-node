import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {
  CollaborationRequest,
  PublicCollaborationRequestForUser,
  PublicCollaborationRequestForWorkspace,
} from '../../definitions/collaborationRequest.js';
import {AssignedPermissionGroupMeta} from '../../definitions/permissionGroups.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {SessionAgent} from '../../definitions/system.js';
import {appAssert} from '../../utils/assertion.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {NotFoundError} from '../errors.js';
import {resourceFields, workspaceResourceFields} from '../extractors.js';
import {checkWorkspaceExists} from '../workspaces/utils.js';

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
  action: FimidaraPermissionAction,
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
  action: FimidaraPermissionAction,
  opts?: SemanticProviderOpParams
) {
  const request = await kIjxSemantic
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
  const inheritanceMap = await kIjxSemantic
    .permissions()
    .getEntityInheritanceMap({
      entityId: request.resourceId,
      fetchDeep: false,
      workspaceId: request.workspaceId,
    });

  return {
    ...request,
    permissionGroupsAssignedOnAcceptingRequest:
      inheritanceMap[request.resourceId].items,
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

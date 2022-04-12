import {
  ICollaborationRequest,
  ICollaborationRequestSentEmailHistoryItem,
  ICollaborationRequestStatus,
  IPublicCollaborationRequest,
} from '../../definitions/collaborationRequest';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {checkWorkspaceExists} from '../workspaces/utils';
import EndpointReusableQueries from '../queries';
import {agentExtractor, agentExtractorIfPresent} from '../utils';

const collaborationRequestFields = getFields<IPublicCollaborationRequest>({
  resourceId: true,
  recipientEmail: true,
  message: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  expiresAt: getDateStringIfPresent,
  workspaceId: true,
  workspaceName: true,
  lastUpdatedAt: getDateStringIfPresent,
  lastUpdatedBy: agentExtractorIfPresent,
  readAt: getDateStringIfPresent,
  statusHistory: makeListExtract(
    getFields<ICollaborationRequestStatus>({
      status: true,
      date: getDateString,
    })
  ),
  sentEmailHistory: makeListExtract(
    getFields<ICollaborationRequestSentEmailHistoryItem>({
      date: getDateString,
      reason: true,
    })
  ),
});

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
    resource: request,
    type: AppResourceType.CollaborationRequest,
    permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
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
  const request = await context.data.collaborationRequest.assertGetItem(
    EndpointReusableQueries.getById(requestId)
  );

  return checkCollaborationRequestAuthorization(
    context,
    agent,
    request,
    action,
    nothrow
  );
}

export const collabRequestExtractor = makeExtract(collaborationRequestFields);
export const collabRequestListExtractor = makeListExtract(
  collaborationRequestFields
);

export function throwCollaborationRequestNotFound() {
  throw new NotFoundError('Collaboration request not found');
}

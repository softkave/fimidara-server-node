import {
  ICollaborationRequest,
  ICollaborationRequestSentEmailHistoryItem,
  ICollaborationRequestStatus,
} from '../../definitions/collaborationRequest';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {checkOrganizationExists} from '../organizations/utils';
import {agentExtractor} from '../utils';
import CollaborationRequestQueries from './queries';
import {IPublicCollaborationRequest} from './types';

const collaborationRequestFields = getFields<IPublicCollaborationRequest>({
  requestId: true,
  recipientEmail: true,
  message: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  expiresAt: getDateString,
  organizationId: true,
  lastUpdatedAt: getDateString,
  lastUpdatedBy: agentExtractor,
  readAt: getDateString,
  statusHistory: makeListExtract(
    getFields<ICollaborationRequestStatus>({
      status: true,
      date: true,
    })
  ),
  sentEmailHistory: makeListExtract(
    getFields<ICollaborationRequestSentEmailHistoryItem>({
      date: true,
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
  const organization = await checkOrganizationExists(
    context,
    request.organizationId
  );

  await checkAuthorization(
    context,
    agent,
    organization.organizationId,
    request.requestId,
    AppResourceType.CollaborationRequest,
    makeBasePermissionOwnerList(organization.organizationId),
    action,
    nothrow
  );

  return {agent, request, organization};
}

export async function checkCollaborationRequestAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  requestId: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const request = await context.data.collaborationRequest.assertGetItem(
    CollaborationRequestQueries.getById(requestId)
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

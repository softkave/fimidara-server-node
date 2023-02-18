import {
  CollaborationRequestStatusType,
  ICollaborationRequestStatus,
  IPublicCollaborationRequest,
} from '../../definitions/collaborationRequest';
import {
  asFieldObjectAny,
  cloneAndMarkNotRequired,
  FieldArray,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
} from '../../mddoc/mddoc';
import {
  endpointHttpHeaderItems,
  endpointHttpResponseItems,
  endpointStatusCodes,
  fReusables,
} from '../endpoints.mddoc';
import {collabRequestConstants} from './constants';
import {
  IGetCollaborationRequestEndpointParams,
  IGetCollaborationRequestEndpointResult,
} from './getRequest/types';
import {
  IGetWorkspaceCollaborationRequestsEndpointParams,
  IGetWorkspaceCollaborationRequestsEndpointResult,
} from './getWorkspaceRequests/types';
import {
  IRevokeCollaborationRequestEndpointParams,
  IRevokeCollaborationRequestEndpointResult,
} from './revokeRequest/types';
import {
  ICollaborationRequestInput,
  ISendCollaborationRequestEndpointParams,
  ISendCollaborationRequestEndpointResult,
} from './sendRequest/types';
import {
  IUpdateCollaborationRequestEndpointParams,
  IUpdateCollaborationRequestEndpointResult,
  IUpdateCollaborationRequestInput,
} from './updateRequest/types';

const recipientEmail = new FieldString().setDescription("Recipient's email address.");
const message = new FieldString().setDescription('Message to recipient.');
const statusType = new FieldString()
  .setDescription('Collaboration request status.')
  .setValid(Object.values(CollaborationRequestStatusType));
const messageNotRequired = cloneAndMarkNotRequired(message);
const newCollaborationRequestInput = new FieldObject<ICollaborationRequestInput>()
  .setName('NewCollaborationRequestInput')
  .setFields({
    recipientEmail,
    message,
    expires: fReusables.expiresNotRequired,
    permissionGroupsOnAccept: fReusables.assignPermissionGroupListNotRequired,
  });

const updateCollaborationRequestInput = new FieldObject<IUpdateCollaborationRequestInput>()
  .setName('NewCollaborationRequestInput')
  .setFields({
    message: messageNotRequired,
    expires: fReusables.expiresNotRequired,
    permissionGroupsOnAccept: fReusables.assignPermissionGroupListNotRequired,
  });

const collaborationRequestStatus = new FieldObject<ICollaborationRequestStatus>()
  .setName('NewCollaborationRequestInput')
  .setFields({
    status: statusType,
    date: fReusables.date,
  });

const collaborationRequest = new FieldObject<IPublicCollaborationRequest>()
  .setName('CollaborationRequest')
  .setFields({
    recipientEmail,
    message,
    resourceId: fReusables.id,
    createdBy: fReusables.agent,
    createdAt: fReusables.date,
    expiresAt: fReusables.expiresOrUndefined,
    workspaceName: fReusables.workspaceName,
    workspaceId: fReusables.workspaceId,
    lastUpdatedBy: fReusables.agent,
    lastUpdatedAt: fReusables.date,
    readAt: fReusables.dateOrUndefined,
    statusHistory: new FieldArray().setType(collaborationRequestStatus),
    permissionGroupsAssignedOnAcceptingRequest: fReusables.assignPermissionGroupList,
  });

const sendCollaborationRequestParams = new FieldObject<ISendCollaborationRequestEndpointParams>()
  .setName('SendCollaborationRequestEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
    request: newCollaborationRequestInput,
  })
  .setRequired(true)
  .setDescription('Send collaboration request endpoint params.');
const sendCollaborationRequestResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<ISendCollaborationRequestEndpointResult>()
        .setName('SendCollaborationRequestEndpointSuccessResult')
        .setFields({request: collaborationRequest})
        .setRequired(true)
        .setDescription('Add collaboration request endpoint success result.')
    ),
];

const getWorkspaceCollaborationRequestsParams =
  new FieldObject<IGetWorkspaceCollaborationRequestsEndpointParams>()
    .setName('GetWorkspaceCollaborationRequestsEndpointParams')
    .setFields({
      workspaceId: fReusables.workspaceIdInputNotRequired,
      page: fReusables.pageNotRequired,
      pageSize: fReusables.pageSizeNotRequired,
    })
    .setRequired(true)
    .setDescription('Get workspace collaboration requests endpoint params.');
const getWorkspaceCollaborationRequestsResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetWorkspaceCollaborationRequestsEndpointResult>()
        .setName('GetWorkspaceCollaborationRequestsEndpointSuccessResult')
        .setFields({
          requests: new FieldArray().setType(collaborationRequest),
          page: fReusables.page,
        })
        .setRequired(true)
        .setDescription('Get workspace collaboration requests endpoint success result.')
    ),
];

const updateCollaborationRequestParams =
  new FieldObject<IUpdateCollaborationRequestEndpointParams>()
    .setName('UpdateCollaborationRequestEndpointParams')
    .setFields({
      requestId: fReusables.id,
      request: updateCollaborationRequestInput,
    })
    .setRequired(true)
    .setDescription('Update collaboration request endpoint params.');
const updateCollaborationRequestResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUpdateCollaborationRequestEndpointResult>()
        .setName('UpdateCollaborationRequestEndpointSuccessResult')
        .setFields({request: collaborationRequest})
        .setRequired(true)
        .setDescription('Update collaboration request endpoint success result.')
    ),
];

const getCollaborationRequestParams = new FieldObject<IGetCollaborationRequestEndpointParams>()
  .setName('GetCollaborationRequestEndpointParams')
  .setFields({
    requestId: fReusables.id,
  })
  .setRequired(true)
  .setDescription('Get collaboration request endpoint params.');
const getCollaborationRequestResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetCollaborationRequestEndpointResult>()
        .setName('GetCollaborationRequestEndpointSuccessResult')
        .setFields({request: collaborationRequest})
        .setRequired(true)
        .setDescription('Get collaboration request endpoint success result.')
    ),
];

const revokeCollaborationRequestParams =
  new FieldObject<IRevokeCollaborationRequestEndpointParams>()
    .setName('RevokeCollaborationRequestEndpointParams')
    .setFields({
      requestId: fReusables.id,
    })
    .setRequired(true)
    .setDescription('Revoke collaboration request endpoint params.');
const revokeCollaborationRequestResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IRevokeCollaborationRequestEndpointResult>()
        .setName('RevokeCollaborationRequestEndpointSuccessResult')
        .setFields({request: collaborationRequest})
        .setRequired(true)
        .setDescription('Revoke collaboration request endpoint success result.')
    ),
];

export const sendCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collabRequestConstants.routes.sendRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(sendCollaborationRequestParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(sendCollaborationRequestResult)
  .setName('Add Collaboration Request Endpoint')
  .setDescription('Add collaboration request endpoint.');

export const getCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collabRequestConstants.routes.getRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getCollaborationRequestParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getCollaborationRequestResult)
  .setName('Get Collaboration Request Endpoint')
  .setDescription('Get collaboration request endpoint.');

export const updateCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collabRequestConstants.routes.updateRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateCollaborationRequestParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateCollaborationRequestResult)
  .setName('Update Collaboration Request Endpoint')
  .setDescription('Update collaboration request endpoint.');

export const revokeCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collabRequestConstants.routes.revokeRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(revokeCollaborationRequestParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(revokeCollaborationRequestResult)
  .setName('Revoke Collaboration Request Endpoint')
  .setDescription('Revoke collaboration request endpoint.');

export const getWorkspaceCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collabRequestConstants.routes.getWorkspaceRequests)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceCollaborationRequestsParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspaceCollaborationRequestsResult)
  .setName('Get Workspace Collaboration Requests Endpoint')
  .setDescription('Get workspace collaboration requests endpoint.');

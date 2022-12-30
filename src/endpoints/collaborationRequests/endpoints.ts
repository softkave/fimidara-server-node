import {
  CollaborationRequestStatusType,
  ICollaborationRequestStatus,
  IPublicCollaborationRequest,
} from '../../definitions/collaborationRequest';
import {
  asFieldObjectAny,
  FieldArray,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
  orUndefined,
} from '../../mddoc/mddoc';
import {endpointHttpHeaderItems, endpointHttpResponseItems, endpointStatusCodes, fReusables} from '../endpoints';
import {IGetCollaborationRequestEndpointParams, IGetCollaborationRequestEndpointResult} from './getRequest/types';
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
const messageOrUndefined = orUndefined(message);
const newCollaborationRequestInput = new FieldObject<ICollaborationRequestInput>()
  .setName('NewCollaborationRequestInput')
  .setFields({
    recipientEmail,
    message,
    expires: fReusables.expiresOrUndefined,
    permissionGroupsOnAccept: fReusables.assignPermissionGroupListOrUndefined,
  });

const updateCollaborationRequestInput = new FieldObject<IUpdateCollaborationRequestInput>()
  .setName('NewCollaborationRequestInput')
  .setFields({
    message: messageOrUndefined,
    expires: fReusables.expiresOrUndefined,
    permissionGroupsOnAccept: fReusables.assignPermissionGroupListOrUndefined,
  });

const collaborationRequestStatus = new FieldObject<ICollaborationRequestStatus>()
  .setName('NewCollaborationRequestInput')
  .setFields({
    status: statusType,
    date: fReusables.date,
  });

const collaborationRequest = new FieldObject<IPublicCollaborationRequest>().setName('CollaborationRequest').setFields({
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
  permissionGroupsOnAccept: fReusables.assignPermissionGroupList,
});

const sendCollaborationRequestParams = new FieldObject<ISendCollaborationRequestEndpointParams>()
  .setName('SendCollaborationRequestEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
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

const getWorkspaceCollaborationRequestsParams = new FieldObject<IGetWorkspaceCollaborationRequestsEndpointParams>()
  .setName('GetWorkspaceCollaborationRequestsEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
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
        .setFields({requests: new FieldArray().setType(collaborationRequest)})
        .setRequired(true)
        .setDescription('Get workspace collaboration requests endpoint success result.')
    ),
];

const updateCollaborationRequestParams = new FieldObject<IUpdateCollaborationRequestEndpointParams>()
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

const revokeCollaborationRequestParams = new FieldObject<IRevokeCollaborationRequestEndpointParams>()
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
  .setBasePathname('/collaborationRequests/sendRequest')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(sendCollaborationRequestParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(sendCollaborationRequestResult);

export const getCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborationRequests/getRequest')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getCollaborationRequestParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getCollaborationRequestResult);

export const updateCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborationRequests/updateRequest')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateCollaborationRequestParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateCollaborationRequestResult);

export const revokeCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborationRequests/revokeRequest')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(revokeCollaborationRequestParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(revokeCollaborationRequestResult);

export const getWorkspaceCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborationRequests/getWorkspaceRequests')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceCollaborationRequestsParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspaceCollaborationRequestsResult);

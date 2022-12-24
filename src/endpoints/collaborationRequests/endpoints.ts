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
  orUndefined,
} from '../../mddoc/mddoc';
import {fReusables, httpHeaderItems, httpResponseItems} from '../endpoints';
import {IBaseEndpointResult} from '../types';
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
  .setRequired(true);

const sendCollaborationRequestResult = new FieldObject<ISendCollaborationRequestEndpointResult & IBaseEndpointResult>()
  .setName('SendCollaborationRequestEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    request: collaborationRequest,
  })
  .setRequired(true)
  .setDescription('Add collaboration request endpoint result');

const getWorkspaceCollaborationRequestsParams = new FieldObject<IGetWorkspaceCollaborationRequestsEndpointParams>()
  .setName('GetWorkspaceCollaborationRequestsEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
  })
  .setRequired(true);

const getWorkspaceCollaborationRequestsResult = new FieldObject<
  IGetWorkspaceCollaborationRequestsEndpointResult & IBaseEndpointResult
>()
  .setName('GetWorkspaceCollaborationRequestsEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    requests: new FieldArray().setType(collaborationRequest),
  })
  .setRequired(true)
  .setDescription('Get workspace collaboration requests endpoint result');

const updateCollaborationRequestParams = new FieldObject<IUpdateCollaborationRequestEndpointParams>()
  .setName('UpdateCollaborationRequestEndpointParams')
  .setFields({
    requestId: fReusables.id,
    request: updateCollaborationRequestInput,
  })
  .setRequired(true);

const updateCollaborationRequestResult = new FieldObject<
  IUpdateCollaborationRequestEndpointResult & IBaseEndpointResult
>()
  .setName('UpdateCollaborationRequestEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    request: collaborationRequest,
  })
  .setRequired(true)
  .setDescription('Update collaboration request endpoint result');

const getCollaborationRequestParams = new FieldObject<IGetCollaborationRequestEndpointParams>()
  .setName('GetCollaborationRequestEndpointParams')
  .setFields({
    requestId: fReusables.id,
  })
  .setRequired(true);

const getCollaborationRequestResult = new FieldObject<IGetCollaborationRequestEndpointResult & IBaseEndpointResult>()
  .setName('GetCollaborationRequestEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    request: collaborationRequest,
  })
  .setRequired(true)
  .setDescription('Get collaboration request endpoint result');

const revokeCollaborationRequestParams = new FieldObject<IRevokeCollaborationRequestEndpointParams>()
  .setName('RevokeCollaborationRequestEndpointParams')
  .setFields({
    requestId: fReusables.id,
  })
  .setRequired(true);

const revokeCollaborationRequestResult = new FieldObject<
  IRevokeCollaborationRequestEndpointResult & IBaseEndpointResult
>()
  .setName('RevokeCollaborationRequestEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    request: collaborationRequest,
  })
  .setRequired(true)
  .setDescription('Revoke collaboration request endpoint result');

export const sendCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborationRequests/sendRequest')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(sendCollaborationRequestParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(sendCollaborationRequestResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const getCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborationRequests/getRequest')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getCollaborationRequestParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getCollaborationRequestResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const updateCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborationRequests/updateRequest')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateCollaborationRequestParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(updateCollaborationRequestResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const revokeCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborationRequests/revokeRequest')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(revokeCollaborationRequestParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(revokeCollaborationRequestResult)
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const getWorkspaceCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborationRequests/getWorkspaceRequests')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceCollaborationRequestsParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getWorkspaceCollaborationRequestsResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

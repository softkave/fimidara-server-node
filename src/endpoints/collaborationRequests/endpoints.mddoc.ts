import {
  CollaborationRequestStatusType,
  IPublicCollaborationRequestForUser,
  IPublicCollaborationRequestForWorkspace,
} from '../../definitions/collaborationRequest';
import {
  FieldArray,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
  asFieldObjectAny,
  cloneAndMarkNotRequired,
} from '../../mddoc/mddoc';
import {
  endpointHttpHeaderItems,
  endpointHttpResponseItems,
  endpointStatusCodes,
  fReusables,
} from '../endpoints.mddoc';
import {collabRequestConstants} from './constants';
import {
  IGetUserCollaborationRequestEndpointParams,
  IGetUserCollaborationRequestEndpointResult,
} from './getUserRequest/types';
import {
  IGetWorkspaceCollaborationRequestEndpointParams,
  IGetWorkspaceCollaborationRequestEndpointResult,
} from './getWorkspaceRequest/types';
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
    // permissionGroupsAssignedOnAcceptingRequest: fReusables.assignPermissionGroupListNotRequired,
  });

const updateCollaborationRequestInput = new FieldObject<IUpdateCollaborationRequestInput>()
  .setName('UpdateCollaborationRequestInput')
  .setFields({
    message: messageNotRequired,
    expires: fReusables.expiresNotRequired,
    // permissionGroupsAssignedOnAcceptingRequest: fReusables.assignPermissionGroupListNotRequired,
  });

const collaborationRequestForUser = new FieldObject<IPublicCollaborationRequestForUser>()
  .setName('CollaborationRequestForUser')
  .setFields({
    recipientEmail,
    message,
    resourceId: fReusables.id,
    createdAt: fReusables.date,
    expiresAt: fReusables.expiresOrUndefined,
    workspaceName: fReusables.workspaceName,
    lastUpdatedAt: fReusables.date,
    readAt: fReusables.dateOrUndefined,
    status: statusType,
    statusDate: fReusables.date,
  });
const collaborationRequestForWorkspace = new FieldObject<IPublicCollaborationRequestForWorkspace>()
  .setName('CollaborationRequestForWorkspace')
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
    status: statusType,
    statusDate: fReusables.date,
    providedResourceId: fReusables.providedResourceIdOrUndefined,
    // permissionGroupsAssignedOnAcceptingRequest: fReusables.assignPermissionGroupList,
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
        .setFields({request: collaborationRequestForWorkspace})
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
          requests: new FieldArray().setType(collaborationRequestForWorkspace),
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
        .setFields({request: collaborationRequestForWorkspace})
        .setRequired(true)
        .setDescription('Update collaboration request endpoint success result.')
    ),
];

const getCollaborationRequestForUserParams =
  new FieldObject<IGetUserCollaborationRequestEndpointParams>()
    .setName('GetCollaborationRequestEndpointParams')
    .setFields({
      requestId: fReusables.id,
    })
    .setRequired(true)
    .setDescription('Get collaboration request endpoint params.');
const getCollaborationRequestForUserResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetUserCollaborationRequestEndpointResult>()
        .setName('GetCollaborationRequestEndpointSuccessResult')
        .setFields({request: collaborationRequestForUser})
        .setRequired(true)
        .setDescription('Get collaboration request endpoint success result.')
    ),
];

const getCollaborationRequestForWorkspaceParams =
  new FieldObject<IGetWorkspaceCollaborationRequestEndpointParams>()
    .setName('GetCollaborationRequestEndpointParams')
    .setFields({
      requestId: fReusables.id,
      workspaceId: fReusables.workspaceIdInputNotRequired,
    })
    .setRequired(true)
    .setDescription('Get collaboration request endpoint params.');
const getCollaborationRequestForWorkspaceResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetWorkspaceCollaborationRequestEndpointResult>()
        .setName('GetCollaborationRequestEndpointSuccessResult')
        .setFields({request: collaborationRequestForWorkspace})
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
        .setFields({request: collaborationRequestForWorkspace})
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
  .setName('AddCollaborationRequestEndpoint')
  .setDescription('Add collaboration request endpoint.');

export const getUserCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collabRequestConstants.routes.getRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getCollaborationRequestForUserParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getCollaborationRequestForUserResult)
  .setName('GetUserCollaborationRequestEndpoint')
  .setDescription('Get user collaboration request endpoint.');

export const getWorkspaceCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collabRequestConstants.routes.getRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getCollaborationRequestForWorkspaceParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getCollaborationRequestForWorkspaceResult)
  .setName('GetWorkspaceCollaborationRequestEndpoint')
  .setDescription('Get workspace collaboration request endpoint.');

export const updateCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collabRequestConstants.routes.updateRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateCollaborationRequestParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateCollaborationRequestResult)
  .setName('UpdateCollaborationRequestEndpoint')
  .setDescription('Update collaboration request endpoint.');

export const revokeCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collabRequestConstants.routes.revokeRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(revokeCollaborationRequestParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(revokeCollaborationRequestResult)
  .setName('RevokeCollaborationRequestEndpoint')
  .setDescription('Revoke collaboration request endpoint.');

// export const getWorkspaceCollaborationRequestEndpointDefinition = new HttpEndpointDefinition()
//   .setBasePathname(collabRequestConstants.routes.getWorkspaceRequests)
//   .setMethod(HttpEndpointMethod.Post)
//   .setRequestBody(asFieldObjectAny(getWorkspaceCollaborationRequestsParams))
//   .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
//   .setResponses(getWorkspaceCollaborationRequestsResult)
//   .setName('GetWorkspaceCollaborationRequestsEndpoint')
//   .setDescription('Get workspace collaboration requests endpoint.');

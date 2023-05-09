import {
  CollaborationRequestStatusType,
  PublicCollaborationRequestForUser,
  PublicCollaborationRequestForWorkspace,
} from '../../definitions/collaborationRequest';
import {
  FieldArray,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {collabRequestConstants} from './constants';
import {CountWorkspaceCollaborationRequestsEndpointParams} from './countWorkspaceRequests/types';
import {DeleteCollaborationRequestEndpointParams} from './deleteRequest/types';
import {
  GetUserCollaborationRequestEndpointParams,
  GetUserCollaborationRequestEndpointResult,
} from './getUserRequest/types';
import {
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointResult,
} from './getUserRequests/types';
import {
  GetWorkspaceCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointResult,
} from './getWorkspaceRequest/types';
import {
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointResult,
} from './getWorkspaceRequests/types';
import {
  RespondToCollaborationRequestEndpointParams,
  RespondToCollaborationRequestEndpointResult,
} from './respondToRequest/types';
import {
  RevokeCollaborationRequestEndpointParams,
  RevokeCollaborationRequestEndpointResult,
} from './revokeRequest/types';
import {
  CollaborationRequestInput,
  SendCollaborationRequestEndpointParams,
  SendCollaborationRequestEndpointResult,
} from './sendRequest/types';
import {
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestEndpointResult,
  UpdateCollaborationRequestInput,
} from './updateRequest/types';

const recipientEmail = FieldString.construct().setDescription("Recipient's email address.");
const message = FieldString.construct().setDescription('Message to recipient.');
const statusType = FieldString.construct()
  .setDescription('Collaboration request status.')
  .setValid(Object.values(CollaborationRequestStatusType))
  .setEnumName('CollaborationRequestStatusType');
const response = FieldString.construct()
  .setDescription('Collaboration request response.')
  .setValid([CollaborationRequestStatusType.Accepted, CollaborationRequestStatusType.Declined])
  .setEnumName('CollaborationRequestResponseType');
const newCollaborationRequestInput = FieldObject.construct<CollaborationRequestInput>()
  .setName('NewCollaborationRequestInput')
  .setFields({
    recipientEmail: FieldObject.requiredField(recipientEmail),
    message: FieldObject.requiredField(message),
    expires: FieldObject.optionalField(fReusables.expires),
  });

const updateCollaborationRequestInput = FieldObject.construct<UpdateCollaborationRequestInput>()
  .setName('UpdateCollaborationRequestInput')
  .setFields({
    message: FieldObject.optionalField(message),
    expires: FieldObject.optionalField(fReusables.expires),
  });

const collaborationRequestForUser = FieldObject.construct<PublicCollaborationRequestForUser>()
  .setName('CollaborationRequestForUser')
  .setFields({
    recipientEmail: FieldObject.requiredField(recipientEmail),
    message: FieldObject.requiredField(message),
    resourceId: FieldObject.requiredField(fReusables.id),
    createdAt: FieldObject.requiredField(fReusables.date),
    expiresAt: FieldObject.optionalField(fReusables.expires),
    workspaceName: FieldObject.requiredField(fReusables.workspaceName),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    readAt: FieldObject.optionalField(fReusables.date),
    status: FieldObject.requiredField(statusType),
    statusDate: FieldObject.requiredField(fReusables.date),
  });
const collaborationRequestForWorkspace =
  FieldObject.construct<PublicCollaborationRequestForWorkspace>()
    .setName('CollaborationRequestForWorkspace')
    .setFields({
      recipientEmail: FieldObject.requiredField(recipientEmail),
      message: FieldObject.requiredField(message),
      resourceId: FieldObject.requiredField(fReusables.id),
      createdBy: FieldObject.requiredField(fReusables.agent),
      createdAt: FieldObject.requiredField(fReusables.date),
      expiresAt: FieldObject.optionalField(fReusables.expires),
      workspaceName: FieldObject.requiredField(fReusables.workspaceName),
      workspaceId: FieldObject.requiredField(fReusables.workspaceId),
      lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
      lastUpdatedAt: FieldObject.requiredField(fReusables.date),
      readAt: FieldObject.optionalField(fReusables.date),
      status: FieldObject.requiredField(statusType),
      statusDate: FieldObject.requiredField(fReusables.date),
      providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
    });

const sendCollaborationRequestParams =
  FieldObject.construct<SendCollaborationRequestEndpointParams>()
    .setName('SendCollaborationRequestEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceId),
      request: FieldObject.requiredField(newCollaborationRequestInput),
    })
    .setRequired(true)
    .setDescription('Send collaboration request endpoint params.');
const sendCollaborationRequestResponseBody =
  FieldObject.construct<SendCollaborationRequestEndpointResult>()
    .setName('SendCollaborationRequestEndpointResult')
    .setFields({request: FieldObject.requiredField(collaborationRequestForWorkspace)})
    .setRequired(true)
    .setDescription('Send collaboration request endpoint success result.');

const getWorkspaceCollaborationRequestsParams =
  FieldObject.construct<GetWorkspaceCollaborationRequestsEndpointParams>()
    .setName('GetWorkspaceCollaborationRequestsEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
      page: FieldObject.optionalField(fReusables.page),
      pageSize: FieldObject.optionalField(fReusables.pageSize),
    })
    .setRequired(true)
    .setDescription('Get workspace collaboration requests endpoint params.');
const getWorkspaceCollaborationRequestsResponseBody =
  FieldObject.construct<GetWorkspaceCollaborationRequestsEndpointResult>()
    .setName('GetWorkspaceCollaborationRequestsEndpointResult')
    .setFields({
      requests: FieldObject.requiredField(
        FieldArray.construct<PublicCollaborationRequestForWorkspace>().setType(
          collaborationRequestForWorkspace
        )
      ),
      page: FieldObject.requiredField(fReusables.page),
    })
    .setRequired(true)
    .setDescription('Get workspace collaboration requests endpoint success result.');

const countWorkspaceCollaborationRequestsParams =
  FieldObject.construct<CountWorkspaceCollaborationRequestsEndpointParams>()
    .setName('CountWorkspaceCollaborationRequestsEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    })
    .setRequired(true)
    .setDescription('Count workspace collaboration requests endpoint params.');

const getUserCollaborationRequestsParams =
  FieldObject.construct<GetUserCollaborationRequestsEndpointParams>()
    .setName('GetUserCollaborationRequestsEndpointParams')
    .setFields({
      page: FieldObject.optionalField(fReusables.page),
      pageSize: FieldObject.optionalField(fReusables.pageSize),
    })
    .setRequired(true)
    .setDescription('Get user collaboration requests endpoint params.');
const getUserCollaborationRequestsResponseBody =
  FieldObject.construct<GetUserCollaborationRequestsEndpointResult>()
    .setName('GetUserCollaborationRequestsEndpointResult')
    .setFields({
      requests: FieldObject.requiredField(
        FieldArray.construct<PublicCollaborationRequestForUser>().setType(
          collaborationRequestForUser
        )
      ),
      page: FieldObject.requiredField(fReusables.page),
    })
    .setRequired(true)
    .setDescription('Get user collaboration requests endpoint success result.');

const updateCollaborationRequestParams =
  FieldObject.construct<UpdateCollaborationRequestEndpointParams>()
    .setName('UpdateCollaborationRequestEndpointParams')
    .setFields({
      requestId: FieldObject.requiredField(fReusables.id),
      request: FieldObject.requiredField(updateCollaborationRequestInput),
    })
    .setRequired(true)
    .setDescription('Update collaboration request endpoint params.');
const updateCollaborationRequestResponseBody =
  FieldObject.construct<UpdateCollaborationRequestEndpointResult>()
    .setName('UpdateCollaborationRequestEndpointResult')
    .setFields({request: FieldObject.requiredField(collaborationRequestForWorkspace)})
    .setRequired(true)
    .setDescription('Update collaboration request endpoint success result.');

const respondToCollaborationRequestParams =
  FieldObject.construct<RespondToCollaborationRequestEndpointParams>()
    .setName('RespondToCollaborationRequestEndpointParams')
    .setFields({
      requestId: FieldObject.requiredField(fReusables.id),
      response: FieldObject.requiredField(response),
    })
    .setRequired(true)
    .setDescription('Respond to collaboration request endpoint params.');
const respondToCollaborationRequestResponseBody =
  FieldObject.construct<RespondToCollaborationRequestEndpointResult>()
    .setName('RespondToCollaborationRequestEndpointResult')
    .setFields({request: FieldObject.requiredField(collaborationRequestForUser)})
    .setRequired(true)
    .setDescription('Respond to collaboration request endpoint success result.');

const getCollaborationRequestForUserParams =
  FieldObject.construct<GetUserCollaborationRequestEndpointParams>()
    .setName('GetUserCollaborationRequestEndpointParams')
    .setFields({
      requestId: FieldObject.requiredField(fReusables.id),
    })
    .setRequired(true)
    .setDescription('Get collaboration request endpoint params.');
const getCollaborationRequestForUserResponseBody =
  FieldObject.construct<GetUserCollaborationRequestEndpointResult>()
    .setName('GetUserCollaborationRequestEndpointResult')
    .setFields({request: FieldObject.requiredField(collaborationRequestForUser)})
    .setRequired(true)
    .setDescription('Get collaboration request endpoint success result.');

const getCollaborationRequestForWorkspaceParams =
  FieldObject.construct<GetWorkspaceCollaborationRequestEndpointParams>()
    .setName('GetWorkspaceCollaborationRequestEndpointParams')
    .setFields({
      requestId: FieldObject.requiredField(fReusables.id),
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    })
    .setRequired(true)
    .setDescription('Get collaboration request endpoint params.');
const getCollaborationRequestForWorkspaceResponseBody =
  FieldObject.construct<GetWorkspaceCollaborationRequestEndpointResult>()
    .setName('GetWorkspaceCollaborationRequestEndpointResult')
    .setFields({request: FieldObject.requiredField(collaborationRequestForWorkspace)})
    .setRequired(true)
    .setDescription('Get collaboration request endpoint success result.');

const revokeCollaborationRequestParams =
  FieldObject.construct<RevokeCollaborationRequestEndpointParams>()
    .setName('RevokeCollaborationRequestEndpointParams')
    .setFields({
      requestId: FieldObject.requiredField(fReusables.id),
    })
    .setRequired(true)
    .setDescription('Revoke collaboration request endpoint params.');
const revokeCollaborationRequestResponseBody =
  FieldObject.construct<RevokeCollaborationRequestEndpointResult>()
    .setName('RevokeCollaborationRequestEndpointResult')
    .setFields({request: FieldObject.requiredField(collaborationRequestForWorkspace)})
    .setRequired(true)
    .setDescription('Revoke collaboration request endpoint success result.');

const deleteCollaborationRequestParams =
  FieldObject.construct<DeleteCollaborationRequestEndpointParams>()
    .setName('DeleteCollaborationRequestEndpointParams')
    .setFields({
      requestId: FieldObject.requiredField(fReusables.id),
    })
    .setRequired(true)
    .setDescription('Delete collaboration request endpoint params.');

export const sendCollaborationRequestEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: SendCollaborationRequestEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: SendCollaborationRequestEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collabRequestConstants.routes.sendRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(sendCollaborationRequestParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(sendCollaborationRequestResponseBody)
  .setName('SendCollaborationRequestEndpoint')
  .setDescription('Send collaboration request endpoint.');

export const getUserCollaborationRequestEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetUserCollaborationRequestEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetUserCollaborationRequestEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collabRequestConstants.routes.getUserRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getCollaborationRequestForUserParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getCollaborationRequestForUserResponseBody)
  .setName('GetUserCollaborationRequestEndpoint')
  .setDescription('Get user collaboration request endpoint.');

export const getWorkspaceCollaborationRequestEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetWorkspaceCollaborationRequestEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetWorkspaceCollaborationRequestEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collabRequestConstants.routes.getWorkspaceRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getCollaborationRequestForWorkspaceParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getCollaborationRequestForWorkspaceResponseBody)
  .setName('GetWorkspaceCollaborationRequestEndpoint')
  .setDescription('Get workspace collaboration request endpoint.');

export const updateCollaborationRequestEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UpdateCollaborationRequestEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: UpdateCollaborationRequestEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collabRequestConstants.routes.updateRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateCollaborationRequestParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateCollaborationRequestResponseBody)
  .setName('UpdateCollaborationRequestEndpoint')
  .setDescription('Update collaboration request endpoint.');

export const respondToCollaborationRequestEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: RespondToCollaborationRequestEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: RespondToCollaborationRequestEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collabRequestConstants.routes.respondToRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(respondToCollaborationRequestParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(respondToCollaborationRequestResponseBody)
  .setName('RespondToCollaborationRequestEndpoint')
  .setDescription('Respond to collaboration request endpoint.');

export const revokeCollaborationRequestEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: RevokeCollaborationRequestEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: RevokeCollaborationRequestEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collabRequestConstants.routes.revokeRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(revokeCollaborationRequestParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(revokeCollaborationRequestResponseBody)
  .setName('RevokeCollaborationRequestEndpoint')
  .setDescription('Revoke collaboration request endpoint.');

export const deleteCollaborationRequestEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: DeleteCollaborationRequestEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collabRequestConstants.routes.deleteRequest)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteCollaborationRequestParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteCollaborationRequestEndpoint')
  .setDescription('Delete collaboration request endpoint.');

export const getWorkspaceCollaborationRequestsEndpointDefinition =
  HttpEndpointDefinition.construct<{
    requestBody: GetWorkspaceCollaborationRequestsEndpointParams;
    requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
    responseBody: GetWorkspaceCollaborationRequestsEndpointResult;
    responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
  }>()
    .setBasePathname(collabRequestConstants.routes.getWorkspaceRequests)
    .setMethod(HttpEndpointMethod.Post)
    .setRequestBody(getWorkspaceCollaborationRequestsParams)
    .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
    .setResponseBody(getWorkspaceCollaborationRequestsResponseBody)
    .setName('GetWorkspaceCollaborationRequestsEndpoint')
    .setDescription('Get workspace collaboration requests endpoint.');

export const getUserCollaborationRequestsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetUserCollaborationRequestsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetUserCollaborationRequestsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collabRequestConstants.routes.getUserRequests)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getUserCollaborationRequestsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getUserCollaborationRequestsResponseBody)
  .setName('GetUserCollaborationRequestsEndpoint')
  .setDescription('Get user collaboration requests endpoint.');

export const countUserCollaborationRequestsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: CountItemsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collabRequestConstants.routes.countUserRequests)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountUserCollaborationRequestsEndpoint')
  .setDescription('Count user collaboration requests endpoint.');

export const countWorkspaceCollaborationRequestsEndpointDefinition =
  HttpEndpointDefinition.construct<{
    requestBody: CountWorkspaceCollaborationRequestsEndpointParams;
    requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
    responseBody: CountItemsEndpointResult;
    responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
  }>()
    .setBasePathname(collabRequestConstants.routes.countWorkspaceRequests)
    .setMethod(HttpEndpointMethod.Post)
    .setRequestBody(countWorkspaceCollaborationRequestsParams)
    .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
    .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
    .setName('CountWorkspaceCollaborationRequestsEndpoint')
    .setDescription('Count workspace collaboration requests endpoint.');

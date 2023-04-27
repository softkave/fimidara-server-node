import {PublicCollaborator} from '../../definitions/user';
import {
  FieldArray,
  FieldObject,
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
import {collaboratorConstants} from './constants';
import {CountWorkspaceCollaboratorsEndpointParams} from './countWorkspaceCollaborators/types';
import {
  GetCollaboratorEndpointParams,
  GetCollaboratorEndpointResult,
} from './getCollaborator/types';
import {
  GetCollaboratorsWithoutPermissionEndpointParams,
  GetCollaboratorsWithoutPermissionEndpointResult,
} from './getCollaboratorsWithoutPermission/types';
import {
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointResult,
} from './getWorkspaceCollaborators/types';
import {RemoveCollaboratorEndpointParams} from './removeCollaborator/types';

const collaborator = FieldObject.construct<PublicCollaborator>()
  .setName('Collaborator')
  .setFields({
    resourceId: FieldObject.requiredField(fReusables.id),
    firstName: FieldObject.requiredField(fReusables.firstName),
    lastName: FieldObject.requiredField(fReusables.lastName),
    email: FieldObject.requiredField(fReusables.emailAddress),
    workspaceId: FieldObject.requiredField(fReusables.workspaceId),
    joinedAt: FieldObject.requiredField(fReusables.date),
  });

const getWorkspaceCollaboratorsParams =
  FieldObject.construct<GetWorkspaceCollaboratorsEndpointParams>()
    .setName('GetWorkspaceCollaboratorsEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
      page: FieldObject.optionalField(fReusables.page),
      pageSize: FieldObject.optionalField(fReusables.pageSize),
    })
    .setRequired(true)
    .setDescription('Get workspace collaborators endpoint params.');
const getWorkspaceCollaboratorsResponseBody =
  FieldObject.construct<GetWorkspaceCollaboratorsEndpointResult>()
    .setName('GetWorkspaceCollaboratorsEndpointResult')
    .setFields({
      collaborators: FieldObject.requiredField(
        FieldArray.construct<PublicCollaborator>().setType(collaborator)
      ),
      page: FieldObject.requiredField(fReusables.page),
    })
    .setRequired(true)
    .setDescription('Get workspace collaborators endpoint success result.');

const getCollaboratorsWithoutPermissionParams =
  FieldObject.construct<GetCollaboratorsWithoutPermissionEndpointParams>()
    .setName('GetCollaboratorsWithoutPermissionEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    })
    .setRequired(true)
    .setDescription('Get workspace collaborators without permissions endpoint params.');
const getCollaboratorsWithoutPermissionResponseBody =
  FieldObject.construct<GetCollaboratorsWithoutPermissionEndpointResult>()
    .setName('GetCollaboratorsWithoutPermissionEndpointResult')
    .setFields({
      collaboratorIds: FieldObject.requiredField(
        FieldArray.construct<string>().setType(fReusables.id)
      ),
    })
    .setRequired(true)
    .setDescription('Get workspace collaborators without permissions endpoint success result.');

const countWorkspaceCollaboratorsParams =
  FieldObject.construct<CountWorkspaceCollaboratorsEndpointParams>()
    .setName('CountWorkspaceCollaboratorsEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    })
    .setRequired(true)
    .setDescription('Count workspace collaborators endpoint params.');

const getCollaboratorParams = FieldObject.construct<GetCollaboratorEndpointParams>()
  .setName('GetCollaboratorEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    collaboratorId: FieldObject.requiredField(fReusables.id),
  })
  .setRequired(true)
  .setDescription('Get collaborator endpoint params.');
const getCollaboratorResponseBody = FieldObject.construct<GetCollaboratorEndpointResult>()
  .setName('GetCollaboratorEndpointResult')
  .setFields({collaborator: FieldObject.requiredField(collaborator)})
  .setRequired(true)
  .setDescription('Get collaborator endpoint success result.');

const removeCollaboratorParams = FieldObject.construct<RemoveCollaboratorEndpointParams>()
  .setName('RevokeCollaboratorEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    collaboratorId: FieldObject.requiredField(fReusables.id),
  })
  .setRequired(true)
  .setDescription('Remove collaborator endpoint params.');

export const getCollaboratorEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetCollaboratorEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetCollaboratorEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collaboratorConstants.routes.getCollaborator)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getCollaboratorParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getCollaboratorResponseBody)
  .setName('GetCollaboratorEndpoint')
  .setDescription('Get collaborator endpoint.');

export const removeCollaboratorEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: RemoveCollaboratorEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collaboratorConstants.routes.removeCollaborator)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(removeCollaboratorParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('RemoveCollaboratorEndpoint')
  .setDescription('Remove collaborator endpoint.');

export const getWorkspaceCollaboratorsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetWorkspaceCollaboratorsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetWorkspaceCollaboratorsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collaboratorConstants.routes.getWorkspaceCollaborators)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceCollaboratorsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspaceCollaboratorsResponseBody)
  .setName('GetWorkspaceCollaboratorsEndpoint')
  .setDescription('Get workspace collaborators endpoint.');

export const countWorkspaceCollaboratorsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: CountWorkspaceCollaboratorsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: CountItemsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(collaboratorConstants.routes.countWorkspaceCollaborators)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspaceCollaboratorsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspaceCollaboratorsEndpoint')
  .setDescription('Count workspace collaborators endpoint.');

export const getCollaboratorsWithoutPermissionEndpointDefinition =
  HttpEndpointDefinition.construct<{
    requestBody: GetCollaboratorsWithoutPermissionEndpointParams;
    requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
    responseBody: GetCollaboratorsWithoutPermissionEndpointResult;
    responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
  }>()
    .setBasePathname(collaboratorConstants.routes.getCollaboratorsWithoutPermission)
    .setMethod(HttpEndpointMethod.Post)
    .setRequestBody(getCollaboratorsWithoutPermissionParams)
    .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
    .setResponseBody(getCollaboratorsWithoutPermissionResponseBody)
    .setName('GetCollaboratorsWithoutPermissionEndpoint')
    .setDescription('Get workspace collaborators without permissions endpoint.');

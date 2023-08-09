import {PublicCollaborator} from '../../definitions/user';
import {HttpEndpointMethod} from '../../mddoc/mddoc';
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

const collaborator = mddocConstruct
  .constructFieldObject<PublicCollaborator>()
  .setName('Collaborator')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    firstName: mddocConstruct.constructFieldObjectField(true, fReusables.firstName),
    lastName: mddocConstruct.constructFieldObjectField(true, fReusables.lastName),
    email: mddocConstruct.constructFieldObjectField(true, fReusables.emailAddress),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceId),
    joinedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    createdAt: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.date.clone().setDescription('Always 0.')
    ),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.date.clone().setDescription('Always 0.')
    ),
  });

const getWorkspaceCollaboratorsParams = mddocConstruct
  .constructFieldObject<GetWorkspaceCollaboratorsEndpointParams>()
  .setName('GetWorkspaceCollaboratorsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(false, fReusables.workspaceIdInput),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(false, fReusables.pageSize),
  })
  .setRequired(true)
  .setDescription('Get workspace collaborators endpoint params.');
const getWorkspaceCollaboratorsResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceCollaboratorsEndpointResult>()
  .setName('GetWorkspaceCollaboratorsEndpointResult')
  .setFields({
    collaborators: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicCollaborator>().setType(collaborator)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  })
  .setRequired(true)
  .setDescription('Get workspace collaborators endpoint success result.');

const getCollaboratorsWithoutPermissionParams = mddocConstruct
  .constructFieldObject<GetCollaboratorsWithoutPermissionEndpointParams>()
  .setName('GetCollaboratorsWithoutPermissionEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(false, fReusables.workspaceIdInput),
  })
  .setRequired(true)
  .setDescription('Get workspace collaborators without permissions endpoint params.');
const getCollaboratorsWithoutPermissionResponseBody = mddocConstruct
  .constructFieldObject<GetCollaboratorsWithoutPermissionEndpointResult>()
  .setName('GetCollaboratorsWithoutPermissionEndpointResult')
  .setFields({
    collaboratorIds: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<string>().setType(fReusables.id)
    ),
  })
  .setRequired(true)
  .setDescription('Get workspace collaborators without permissions endpoint success result.');

const countWorkspaceCollaboratorsParams = mddocConstruct
  .constructFieldObject<CountWorkspaceCollaboratorsEndpointParams>()
  .setName('CountWorkspaceCollaboratorsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(false, fReusables.workspaceIdInput),
  })
  .setRequired(true)
  .setDescription('Count workspace collaborators endpoint params.');

const getCollaboratorParams = mddocConstruct
  .constructFieldObject<GetCollaboratorEndpointParams>()
  .setName('GetCollaboratorEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(false, fReusables.workspaceIdInput),
    collaboratorId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  })
  .setRequired(true)
  .setDescription('Get collaborator endpoint params.');
const getCollaboratorResponseBody = mddocConstruct
  .constructFieldObject<GetCollaboratorEndpointResult>()
  .setName('GetCollaboratorEndpointResult')
  .setFields({collaborator: mddocConstruct.constructFieldObjectField(true, collaborator)})
  .setRequired(true)
  .setDescription('Get collaborator endpoint success result.');

const removeCollaboratorParams = mddocConstruct
  .constructFieldObject<RemoveCollaboratorEndpointParams>()
  .setName('RevokeCollaboratorEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(false, fReusables.workspaceIdInput),
    collaboratorId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
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

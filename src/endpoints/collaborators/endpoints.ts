import {IPublicCollaborator} from '../../definitions/user';
import {
  asFieldObjectAny,
  FieldArray,
  FieldObject,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
} from '../../mddoc/mddoc';
import {endpointHttpHeaderItems, endpointHttpResponseItems, endpointStatusCodes, fReusables} from '../endpoints';
import {IGetCollaboratorEndpointParams, IGetCollaboratorEndpointResult} from './getCollaborator/types';
import {
  IGetWorkspaceCollaboratorsEndpointParams,
  IGetWorkspaceCollaboratorsEndpointResult,
} from './getWorkspaceCollaborators/types';
import {IRemoveCollaboratorEndpointParams} from './removeCollaborator/types';
import {
  IUpdateCollaboratorPermissionGroupsEndpointParams,
  IUpdateCollaboratorPermissionGroupsEndpointResult,
} from './updateCollaboratorPermissionGroups/types';

const collaborator = new FieldObject<IPublicCollaborator>().setName('Collaborator').setFields({
  resourceId: fReusables.id,
  firstName: fReusables.firstName,
  lastName: fReusables.lastName,
  email: fReusables.emailAddress,
  workspaceId: fReusables.workspaceId,
  joinedAt: fReusables.date,
  permissionGroups: fReusables.assignPermissionGroupList,
});

const getWorkspaceCollaboratorsParams = new FieldObject<IGetWorkspaceCollaboratorsEndpointParams>()
  .setName('GetWorkspaceCollaboratorsEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
  })
  .setRequired(true)
  .setDescription('Get workspace collaborators endpoint params.');
const getWorkspaceCollaboratorsResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetWorkspaceCollaboratorsEndpointResult>()
        .setName('GetWorkspaceCollaboratorsEndpointSuccessResult')
        .setFields({collaborators: new FieldArray().setType(collaborator)})
        .setRequired(true)
        .setDescription('Get workspace collaborators endpoint success result.')
    ),
];

const updateCollaboratorPermissionGroupsParams = new FieldObject<IUpdateCollaboratorPermissionGroupsEndpointParams>()
  .setName('UpdateCollaboratorEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    collaboratorId: fReusables.id,
    permissionGroups: fReusables.assignPermissionGroupList,
  })
  .setRequired(true)
  .setDescription('Update collaborator endpoint success result.');
const updateCollaboratorPermissionGroupsResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUpdateCollaboratorPermissionGroupsEndpointResult>()
        .setName('UpdateCollaboratorEndpointSuccessResult')
        .setFields({collaborator})
        .setRequired(true)
        .setDescription('Update collaborator endpoint success result.')
    ),
];

const getCollaboratorParams = new FieldObject<IGetCollaboratorEndpointParams>()
  .setName('GetCollaboratorEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    collaboratorId: fReusables.id,
  })
  .setRequired(true)
  .setDescription('Get collaborator endpoint params.');
const getCollaboratorResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetCollaboratorEndpointResult>()
        .setName('GetCollaboratorEndpointSuccessResult')
        .setFields({collaborator})
        .setRequired(true)
        .setDescription('Get collaborator endpoint success result.')
    ),
];

const removeCollaboratorParams = new FieldObject<IRemoveCollaboratorEndpointParams>()
  .setName('RevokeCollaboratorEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    collaboratorId: fReusables.id,
  })
  .setRequired(true)
  .setDescription('Remove collaborator endpoint params.');

export const getCollaboratorEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborators/getCollaborator')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getCollaboratorParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getCollaboratorResult);

export const updateCollaboratorPermissionGroupsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborators/updateCollaboratorPermissionGroups')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateCollaboratorPermissionGroupsParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateCollaboratorPermissionGroupsResult);

export const removeCollaboratorEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborators/removeCollaborator')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(removeCollaboratorParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse);

export const getWorkspaceCollaboratorEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborators/getWorkspaceCollaborators')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceCollaboratorsParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspaceCollaboratorsResult);

import {IPublicCollaborator} from '../../definitions/user';
import {
  asFieldObjectAny,
  FieldArray,
  FieldObject,
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
import {collaboratorConstants} from './constants';
import {
  IGetCollaboratorEndpointParams,
  IGetCollaboratorEndpointResult,
} from './getCollaborator/types';
import {
  IGetWorkspaceCollaboratorsEndpointParams,
  IGetWorkspaceCollaboratorsEndpointResult,
} from './getWorkspaceCollaborators/types';
import {IRemoveCollaboratorEndpointParams} from './removeCollaborator/types';

const collaborator = new FieldObject<IPublicCollaborator>().setName('Collaborator').setFields({
  resourceId: fReusables.id,
  firstName: fReusables.firstName,
  lastName: fReusables.lastName,
  email: fReusables.emailAddress,
  workspaceId: fReusables.workspaceId,
  joinedAt: fReusables.date,
});

const getWorkspaceCollaboratorsParams = new FieldObject<IGetWorkspaceCollaboratorsEndpointParams>()
  .setName('GetWorkspaceCollaboratorsEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
    page: fReusables.pageNotRequired,
    pageSize: fReusables.pageSizeNotRequired,
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
        .setFields({collaborators: new FieldArray().setType(collaborator), page: fReusables.page})
        .setRequired(true)
        .setDescription('Get workspace collaborators endpoint success result.')
    ),
];

const getCollaboratorParams = new FieldObject<IGetCollaboratorEndpointParams>()
  .setName('GetCollaboratorEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
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
    workspaceId: fReusables.workspaceIdInputNotRequired,
    collaboratorId: fReusables.id,
  })
  .setRequired(true)
  .setDescription('Remove collaborator endpoint params.');

export const getCollaboratorEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collaboratorConstants.routes.getCollaborator)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getCollaboratorParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getCollaboratorResult)
  .setName('Get Collaborator Endpoint')
  .setDescription('Get collaborator endpoint.');

export const removeCollaboratorEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collaboratorConstants.routes.removeCollaborator)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(removeCollaboratorParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('Remove Collaborator Endpoint')
  .setDescription('Remove collaborator endpoint.');

export const getWorkspaceCollaboratorEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(collaboratorConstants.routes.getWorkspaceCollaborators)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceCollaboratorsParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspaceCollaboratorsResult)
  .setName('Get Workspace Collaborators Endpoint')
  .setDescription('Get workspace collaborators endpoint.');
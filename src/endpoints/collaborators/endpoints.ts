import {IPublicCollaborator} from '../../definitions/user';
import {
  asFieldObjectAny,
  FieldArray,
  FieldObject,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  orUndefined,
} from '../../mddoc/mddoc';
import {fReusables, httpHeaderItems, httpResponseItems} from '../endpoints';
import {IBaseEndpointResult} from '../types';
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
  .setRequired(true);

const getWorkspaceCollaboratorsResult = new FieldObject<
  IGetWorkspaceCollaboratorsEndpointResult & IBaseEndpointResult
>()
  .setName('GetWorkspaceCollaboratorsEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    collaborators: orUndefined(new FieldArray().setType(collaborator)),
  })
  .setRequired(true)
  .setDescription('Get workspace collaboration requests endpoint result');

const updateCollaboratorPermissionGroupsParams = new FieldObject<IUpdateCollaboratorPermissionGroupsEndpointParams>()
  .setName('UpdateCollaboratorEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    collaboratorId: fReusables.id,
    permissionGroups: fReusables.assignPermissionGroupList,
  })
  .setRequired(true);

const updateCollaboratorPermissionGroupsResult = new FieldObject<
  IUpdateCollaboratorPermissionGroupsEndpointResult & IBaseEndpointResult
>()
  .setName('UpdateCollaboratorEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    collaborator: orUndefined(collaborator),
  })
  .setRequired(true)
  .setDescription('Update collaboration request endpoint result');

const getCollaboratorParams = new FieldObject<IGetCollaboratorEndpointParams>()
  .setName('GetCollaboratorEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    collaboratorId: fReusables.id,
  })
  .setRequired(true);

const getCollaboratorResult = new FieldObject<IGetCollaboratorEndpointResult & IBaseEndpointResult>()
  .setName('GetCollaboratorEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    collaborator: orUndefined(collaborator),
  })
  .setRequired(true)
  .setDescription('Get collaboration request endpoint result');

const removeCollaboratorParams = new FieldObject<IRemoveCollaboratorEndpointParams>()
  .setName('RevokeCollaboratorEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    collaboratorId: fReusables.id,
  })
  .setRequired(true);

export const getCollaboratorEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborators/getCollaborator')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getCollaboratorParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getCollaboratorResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const updateCollaboratorPermissionGroupsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborators/updateCollaboratorPermissionGroups')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateCollaboratorPermissionGroupsParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(updateCollaboratorPermissionGroupsResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const removeCollaboratorEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborators/removeCollaborator')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(removeCollaboratorParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(httpResponseItems.defaultResponse)
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const getWorkspaceCollaboratorEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/collaborators/getWorkspaceCollaborators')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceCollaboratorsParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getWorkspaceCollaboratorsResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

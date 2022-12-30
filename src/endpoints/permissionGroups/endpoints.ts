import {IPermissionGroupMatcher, IPublicPermissionGroup} from '../../definitions/permissionGroups';
import {ExcludeTags} from '../../definitions/tag';
import {
  asFieldObjectAny,
  FieldArray,
  FieldObject,
  FieldObjectFields,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
  orUndefined,
  partialFieldObject,
} from '../../mddoc/mddoc';
import {endpointHttpHeaderItems, endpointHttpResponseItems, endpointStatusCodes, fReusables} from '../endpoints';
import {
  IAddPermissionGroupEndpointParams,
  IAddPermissionGroupEndpointResult,
  INewPermissionGroupInput,
} from './addPermissionGroup/types';
import {IDeletePermissionGroupEndpointParams} from './deletePermissionGroup/types';
import {IGetPermissionGroupEndpointParams, IGetPermissionGroupEndpointResult} from './getPermissionGroup/types';
import {
  IGetWorkspacePermissionGroupsEndpointParams,
  IGetWorkspacePermissionGroupsEndpointResult,
} from './getWorkspacePermissionGroups/types';
import {
  IUpdatePermissionGroupEndpointParams,
  IUpdatePermissionGroupEndpointResult,
} from './udpatePermissionGroup/types';

const newPermissionGroupInput = new FieldObject<ExcludeTags<INewPermissionGroupInput>>()
  .setName('NewPermissionGroupInput')
  .setFields({
    name: fReusables.name,
    description: fReusables.descriptionOrUndefined,
    permissionGroups: fReusables.assignPermissionGroupListOrUndefined,
  });

const permissionGroup = new FieldObject<ExcludeTags<IPublicPermissionGroup>>().setName('PermissionGroup').setFields({
  resourceId: new FieldString(),
  createdBy: fReusables.agent,
  createdAt: fReusables.date,
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  name: fReusables.name,
  description: fReusables.descriptionOrUndefined,
  workspaceId: fReusables.workspaceId,
  permissionGroups: fReusables.assignPermissionGroupList,
});

const permissionGroupId = fReusables.permissionGroupId
  .clone()
  .setDescription(
    'Permission group ID. Either provide the permission group ID, or provide the workspace ID and permission group name.'
  );
const name = fReusables.name
  .clone()
  .setDescription(
    'Permission group name. Either provide the permission group ID, or provide the workspace ID and permission group name.'
  );
const workspaceIdInput = fReusables.workspaceId
  .clone()
  .setDescription(
    fReusables.workspaceIdInputOrUndefined.assertGetDescription() +
      'Either provide the permission group ID, or provide the workspace ID and permission group name.'
  );
const permissionGroupIdOrUndefined = orUndefined(permissionGroupId);
const nameOrUndefined = orUndefined(name);
const workspaceIdInputOrUndefined = orUndefined(workspaceIdInput);

const permissionGroupMatcherParts: FieldObjectFields<IPermissionGroupMatcher> = {
  permissionGroupId: permissionGroupIdOrUndefined,
  name: nameOrUndefined,
  workspaceId: workspaceIdInputOrUndefined,
};

const addPermissionGroupParams = new FieldObject<IAddPermissionGroupEndpointParams>()
  .setName('AddPermissionGroupEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    permissionGroup: newPermissionGroupInput,
  })
  .setRequired(true)
  .setDescription('Add permission group endpoint params.');
const addPermissionGroupResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IAddPermissionGroupEndpointResult>()
        .setName('AddPermissionGroupEndpointSuccessResult')
        .setFields({permissionGroup})
        .setRequired(true)
        .setDescription('Add permission group endpoint success result.')
    ),
];

const getWorkspacePermissionGroupsParams = new FieldObject<IGetWorkspacePermissionGroupsEndpointParams>()
  .setName('GetWorkspacePermissionGroupsEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
  })
  .setRequired(true)
  .setDescription('Get workspace permission groups endpoint params.');
const getWorkspacePermissionGroupsResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetWorkspacePermissionGroupsEndpointResult>()
        .setName('GetWorkspacePermissionGroupsEndpointSuccessResult')
        .setFields({permissionGroups: new FieldArray().setType(permissionGroup)})
        .setRequired(true)
        .setDescription('Get workspace permission groups endpoint success result.')
    ),
];

const updatePermissionGroupParams = new FieldObject<IUpdatePermissionGroupEndpointParams>()
  .setName('UpdatePermissionGroupEndpointParams')
  .setFields({
    ...permissionGroupMatcherParts,
    permissionGroup: partialFieldObject(newPermissionGroupInput),
  })
  .setRequired(true)
  .setDescription('Update permission group endpoint params.');
const updatePermissionGroupResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUpdatePermissionGroupEndpointResult>()
        .setName('UpdatePermissionGroupEndpointSuccessResult')
        .setFields({permissionGroup})
        .setRequired(true)
        .setDescription('Update permission group endpoint success result.')
    ),
];

const getPermissionGroupParams = new FieldObject<IGetPermissionGroupEndpointParams>()
  .setName('GetPermissionGroupEndpointParams')
  .setFields(permissionGroupMatcherParts)
  .setRequired(true)
  .setDescription('Get permission group endpoint params.');
const getPermissionGroupResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetPermissionGroupEndpointResult>()
        .setName('GetPermissionGroupEndpointSuccessResult')
        .setFields({permissionGroup})
        .setRequired(true)
        .setDescription('Get permission group endpoint success result.')
    ),
];

const deletePermissionGroupParams = new FieldObject<IDeletePermissionGroupEndpointParams>()
  .setName('DeletePermissionGroupEndpointParams')
  .setFields(permissionGroupMatcherParts)
  .setRequired(true)
  .setDescription('Delete permission group endpoint params.');

export const addPermissionGroupEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/permissionGroups/addPermissionGroup')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addPermissionGroupParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addPermissionGroupResult);

export const getPermissionGroupEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/permissionGroups/getPermissionGroup')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getPermissionGroupParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getPermissionGroupResult);

export const updatePermissionGroupEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/permissionGroups/updatePermissionGroup')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updatePermissionGroupParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updatePermissionGroupResult);

export const deletePermissionGroupEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/permissionGroups/deletePermissionGroup')
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deletePermissionGroupParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse);

export const getWorkspacePermissionGroupsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/permissionGroups/getWorkspacePermissionGroups')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspacePermissionGroupsParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspacePermissionGroupsResult);

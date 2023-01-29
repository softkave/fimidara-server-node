import {IPermissionGroupMatcher, IPublicPermissionGroup} from '../../definitions/permissionGroups';
import {ExcludeTags} from '../../definitions/tag';
import {
  asFieldObjectAny,
  cloneAndMarkNotRequired,
  FieldArray,
  FieldObject,
  FieldObjectFields,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
  partialFieldObject,
} from '../../mddoc/mddoc';
import {endpointHttpHeaderItems, endpointHttpResponseItems, endpointStatusCodes, fReusables} from '../endpoints.mddoc';
import {
  IAddPermissionGroupEndpointParams,
  IAddPermissionGroupEndpointResult,
  INewPermissionGroupInput,
} from './addPermissionGroup/types';
import {permissionGroupConstants} from './constants';
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
    description: fReusables.descriptionNotRequired,
    permissionGroups: fReusables.assignPermissionGroupListNotRequired,
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
    fReusables.workspaceIdInputNotRequired.assertGetDescription() +
      'Either provide the permission group ID, or provide the workspace ID and permission group name.'
  );

const permissionGroupIdNotRequired = cloneAndMarkNotRequired(permissionGroupId);
const nameNotRequired = cloneAndMarkNotRequired(name);
const workspaceIdInputNotRequired = cloneAndMarkNotRequired(workspaceIdInput);

const permissionGroupMatcherParts: FieldObjectFields<IPermissionGroupMatcher> = {
  permissionGroupId: permissionGroupIdNotRequired,
  name: nameNotRequired,
  workspaceId: workspaceIdInputNotRequired,
};

const addPermissionGroupParams = new FieldObject<IAddPermissionGroupEndpointParams>()
  .setName('AddPermissionGroupEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
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
    workspaceId: fReusables.workspaceIdInputNotRequired,
    page: fReusables.pageNotRequired,
    pageSize: fReusables.pageSizeNotRequired,
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
        .setFields({permissionGroups: new FieldArray().setType(permissionGroup), page: fReusables.page})
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
  .setBasePathname(permissionGroupConstants.routes.addPermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addPermissionGroupParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addPermissionGroupResult)
  .setName('Add Permission Group Endpoint')
  .setDescription('Add permission group endpoint.');

export const getPermissionGroupEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(permissionGroupConstants.routes.getPermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getPermissionGroupParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getPermissionGroupResult)
  .setName('Get Permission Group Endpoint')
  .setDescription('Get permission group endpoint.');

export const updatePermissionGroupEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(permissionGroupConstants.routes.updatePermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updatePermissionGroupParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updatePermissionGroupResult)
  .setName('Update Permission Group Endpoint')
  .setDescription('Update permission group endpoint.');

export const deletePermissionGroupEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(permissionGroupConstants.routes.deletePermissionGroup)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deletePermissionGroupParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('Delete Permission Group Endpoint')
  .setDescription('Delete permission group endpoint.');

export const getWorkspacePermissionGroupsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(permissionGroupConstants.routes.getWorkspacePermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspacePermissionGroupsParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspacePermissionGroupsResult)
  .setName('Get Workspace Permission Groups Endpoint')
  .setDescription('Get workspace permission groups endpoint.');

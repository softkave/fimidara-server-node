import {IPublicPermissionItem} from '../../definitions/permissionItem';
import {AppResourceType, getWorkspaceResourceTypeList} from '../../definitions/system';
import {ExcludeTags} from '../../definitions/tag';
import {
  FieldArray,
  FieldBoolean,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
  asFieldObjectAny,
  cloneAndMarkNotRequired,
  orUndefined,
} from '../../mddoc/mddoc';
import {
  endpointHttpResponseItems,
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointStatusCodes,
} from '../endpoints.mddoc';
import {
  IAddPermissionItemsEndpointParams,
  IAddPermissionItemsEndpointResult,
} from './addItems/types';
import {permissionItemConstants} from './constants';
import {IDeletePermissionItemsByIdEndpointParams} from './deleteItemsById/types';
import {
  IGetEntityPermissionItemsEndpointParams,
  IGetEntityPermissionItemsEndpointResult,
} from './getEntityPermissionItems/types';
import {
  IGetResourcePermissionItemsEndpointParams,
  IGetResourcePermissionItemsEndpointResult,
} from './getResourcePermissionItems/types';
import {IPermissionItemInput, IPermissionItemInputTarget} from './types';

const targetId = fReusables.workspaceId
  .clone()
  .setDescription('Resource ID of the resource to retrieve permission items for.');
const targetType = fReusables.resourceType
  .clone()
  .setDescription(
    'Resource type to retrieve permission items for. ' +
      'You can pass only the resource type to retrieve all the permission items ' +
      'that grant access to a resource type, or also pass a resource ID to restrict it to just that resource.'
  )
  .setValid(getWorkspaceResourceTypeList())
  .setEnumName('WorkspaceAppResourceType');
const entityId = fReusables.permissionGroupId
  .clone()
  .setDescription(
    'Permission entity resource ID. ' +
      'Permission entity is the resource granted access. ' +
      'This can be a user, a permission group, a permission item, or a client assigned token.'
  );
const entityType = new FieldString()
  .setDescription(
    'Permission entity resource type. ' +
      'Permission entity is the resource granted access. ' +
      'This can be a user, a permission group, a permission item, or a client assigned token.'
  )
  .setValid([AppResourceType.User, AppResourceType.PermissionGroup, AppResourceType.AgentToken])
  .setEnumName('EntityAppResourceType');
const grantAccess = new FieldBoolean().setDescription(
  'Whether access is granted or not. ' + 'Access is granted if true, denied if false.'
);
const targetIdOrUndefined = orUndefined(targetId);
const targetIdNotRequired = cloneAndMarkNotRequired(targetId);
const entityIdNotRequired = cloneAndMarkNotRequired(entityId);

// TODO: add or array to target, container, and entity, and confirm mddoc md
// renderer renders it well.
const target = new FieldObject<ExcludeTags<IPermissionItemInputTarget>>()
  .setName('NewPermissionItemInputTarget')
  .setFields({
    targetType,
    targetId: targetIdNotRequired,
    filepath: fReusables.filepathNotRequired,
    folderpath: fReusables.folderpathNotRequired,
    workspaceRootname: fReusables.rootnameNotRequired,
  });

const newPermissionItemInput = new FieldObject<ExcludeTags<IPermissionItemInput>>()
  .setName('NewPermissionItemInput')
  .setFields({
    target,
    grantAccess,
    entity: entityIdNotRequired,
    action: fReusables.action,
    appliesTo: fReusables.appliesTo,
  });

const newPermissionItemInputList = new FieldArray()
  .setType(newPermissionItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsSavedPerRequest);

const permissionItem = new FieldObject<ExcludeTags<IPublicPermissionItem>>()
  .setName('PermissionItem')
  .setFields({
    entityId,
    entityType,
    targetType,
    resourceId: new FieldString(),
    createdBy: fReusables.agent,
    createdAt: fReusables.date,
    workspaceId: fReusables.workspaceId,
    targetId: targetIdOrUndefined,
    action: fReusables.action,
    grantAccess: new FieldBoolean(),
    lastUpdatedAt: fReusables.date,
    lastUpdatedBy: fReusables.agent,
    providedResourceId: fReusables.providedResourceIdOrUndefined,
    appliesTo: fReusables.appliesTo,
  });

const addPermissionItemsParams = new FieldObject<IAddPermissionItemsEndpointParams>()
  .setName('AddPermissionItemsEndpointParams')
  .setFields({
    entity: entityIdNotRequired,
    workspaceId: fReusables.workspaceIdInputNotRequired,
    items: newPermissionItemInputList,
  })
  .setRequired(true)
  .setDescription('Add permission items endpoint params.');
const addPermissionItemsResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IAddPermissionItemsEndpointResult>()
        .setName('AddPermissionItemsEndpointSuccessResult')
        .setFields({items: new FieldArray().setType(permissionItem)})
        .setRequired(true)
        .setDescription('Add permission items endpoint success result.')
    ),
];

const getResourcePermissionItemsParams =
  new FieldObject<IGetResourcePermissionItemsEndpointParams>()
    .setName('GetResourcePermissionItemsEndpointParams')
    .setFields({
      target,
      workspaceId: fReusables.workspaceIdInputNotRequired,
    })
    .setRequired(true)
    .setDescription(
      'Get resource permission items endpoint params. ' +
        'Returns all the permission items granting access to a resource or resource type.'
    );
const getResourcePermissionItemsResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetResourcePermissionItemsEndpointResult>()
        .setName('GetResourcePermissionItemsEndpointSuccessResult')
        .setFields({items: new FieldArray().setType(permissionItem)})
        .setRequired(true)
        .setDescription(
          'Get resource permission items endpoint result. ' +
            'Returns all the permission items granting access to a resource or resource type.'
        )
    ),
];

const getEntityPermissionItemsParams = new FieldObject<IGetEntityPermissionItemsEndpointParams>()
  .setName('getEntityPermissionItemsEndpointParams')
  .setFields({
    entityId,
    workspaceId: fReusables.workspaceIdInputNotRequired,
    page: fReusables.pageNotRequired,
    pageSize: fReusables.pageSizeNotRequired,
  })
  .setRequired(true)
  .setDescription('Get entity permission items endpoint params.');
const getEntityPermissionItemsResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetEntityPermissionItemsEndpointResult>()
        .setName('getEntityPermissionItemsEndpointSuccessResult')
        .setFields({items: new FieldArray().setType(permissionItem), page: fReusables.page})
        .setRequired(true)
        .setDescription('Get permission items endpoint success result.')
    ),
];

const deletePermissionItemsByIdParams = new FieldObject<IDeletePermissionItemsByIdEndpointParams>()
  .setName('DeletePermissionItemsByIdEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
    itemIds: new FieldArray()
      .setType(fReusables.permissionItemId)
      .setMax(permissionItemConstants.maxPermissionItemsSavedPerRequest),
  })
  .setRequired(true)
  .setDescription('Delete permission items endpoint params.');

export const addPermissionItemsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(permissionItemConstants.routes.addItems)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addPermissionItemsParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addPermissionItemsResult)
  .setName('AddPermissionItemsEndpoint')
  .setDescription('Add permission items endpoint.');

export const getEntityPermissionItemsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(permissionItemConstants.routes.getEntityPermissionItems)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getEntityPermissionItemsParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getEntityPermissionItemsResult)
  .setName('GetEntityPermissionItemsEndpoint')
  .setDescription('Get entity permission items endpoint.');

export const deletePermissionItemsByIdEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(permissionItemConstants.routes.deleteItemsById)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deletePermissionItemsByIdParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('DeletePermissionItemsEndpoint')
  .setDescription('Delete permission items endpoint.');

export const getResourcePermissionItemsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(permissionItemConstants.routes.getResourcePermissionItems)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getResourcePermissionItemsParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getResourcePermissionItemsResult)
  .setName('GetResourcePermissionItemsEndpoint')
  .setDescription('Get resource permission items endpoint.');

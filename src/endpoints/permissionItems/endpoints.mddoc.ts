import {IPublicPermissionItem} from '../../definitions/permissionItem';
import {AppResourceType, getWorkspaceResourceTypeList} from '../../definitions/system';
import {ExcludeTags} from '../../definitions/tag';
import {
  asFieldObjectAny,
  cloneAndMarkNotRequired,
  FieldArray,
  FieldBoolean,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
  orUndefined,
} from '../../mddoc/mddoc';
import {
  endpointHttpHeaderItems,
  endpointHttpResponseItems,
  endpointStatusCodes,
  fReusables,
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
import {
  IPermissionItemInput,
  IPermissionItemInputContainer,
  IPermissionItemInputEntity,
  IPermissionItemInputTarget,
} from './types';

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
  .setValid(getWorkspaceResourceTypeList());
const containerId = fReusables.workspaceId
  .clone()
  .setDescription(
    'Resource ID of the container resource to search under. ' +
      'Defaults to workspace ID. ' +
      'Containers serve to subclass permission so that you can for example, ' +
      'grant access to all files in a folder without risking granting permission to all the files in a workspace.'
  );
const containerType = new FieldString()
  .setDescription(
    'Resource type of the container resource to search under. ' +
      'Defaults to workspace. ' +
      'Containers serve to subclass permission so that you can for example, ' +
      'grant access to all files in a folder without risking granting permission to all the files in a workspace.'
  )
  .setValid([AppResourceType.Workspace, AppResourceType.Folder]);
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
  .setValid([AppResourceType.User, AppResourceType.PermissionGroup, AppResourceType.AgentToken]);
const grantAccess = new FieldBoolean().setDescription(
  'Whether access is granted or not. ' + 'Access is granted if true, denied if false.'
);
const targetIdOrUndefined = orUndefined(targetId);
const containerIdNotRequired = cloneAndMarkNotRequired(containerId);
const targetIdNotRequired = cloneAndMarkNotRequired(targetId);
const entityIdNotRequired = cloneAndMarkNotRequired(entityId);

// TODO: add or array to target, container, and entity, and confirm mddoc md
// renderer renders it well.
const target = new FieldObject<ExcludeTags<IPermissionItemInputTarget>>()
  .setName('NewPermissionItemInput')
  .setFields({
    targetType,
    targetId: targetIdNotRequired,
    filepath: fReusables.filepathNotRequired,
    folderpath: fReusables.folderpathNotRequired,
    workspaceRootname: fReusables.rootnameNotRequired,
  });
const container = new FieldObject<ExcludeTags<IPermissionItemInputContainer>>()
  .setName('NewPermissionItemInput')
  .setFields({
    containerId: containerIdNotRequired,
    folderpath: fReusables.folderpathNotRequired,
    workspaceRootname: fReusables.rootnameNotRequired,
  });
const entity = new FieldObject<ExcludeTags<IPermissionItemInputEntity>>()
  .setName('NewPermissionItemInput')
  .setFields({
    entityId: entityIdNotRequired,
  });

const containerNotRequired = cloneAndMarkNotRequired(container);
const entityNotRequired = cloneAndMarkNotRequired(entity);

const newPermissionItemInput = new FieldObject<ExcludeTags<IPermissionItemInput>>()
  .setName('NewPermissionItemInput')
  .setFields({
    target,
    grantAccess,
    container: containerNotRequired,
    entity: entityIdNotRequired,
    action: fReusables.action,
    // appliesTo: fReusables.appliesTo,
  });

const newPermissionItemInputList = new FieldArray()
  .setType(newPermissionItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsSavedPerRequest);

const permissionItem = new FieldObject<ExcludeTags<IPublicPermissionItem>>()
  .setName('PermissionItem')
  .setFields({
    containerId,
    containerType,
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
    // appliesTo: fReusables.appliesTo,
  });

const addPermissionItemsParams = new FieldObject<IAddPermissionItemsEndpointParams>()
  .setName('AddPermissionItemsEndpointParams')
  .setFields({
    container: containerNotRequired,
    entity: entityIdNotRequired,
    workspaceId: fReusables.workspaceIdInputNotRequired,
    items: newPermissionItemInputList,
  })
  .setRequired(true)
  .setDescription('Add permission items endpoint params.');
const addPermissionItemsResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
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
      workspaceId: fReusables.workspaceIdInputNotRequired,
      targetId: targetIdNotRequired,
      targetType: targetType,
      containerId: containerIdNotRequired,
      page: fReusables.pageNotRequired,
      pageSize: fReusables.pageSizeNotRequired,
    })
    .setRequired(true)
    .setDescription(
      'Get resource permission items endpoint params. ' +
        'Returns all the permission items granting access to a resource or resource type.'
    );
const getResourcePermissionItemsResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetResourcePermissionItemsEndpointResult>()
        .setName('GetResourcePermissionItemsEndpointSuccessResult')
        .setFields({items: new FieldArray().setType(permissionItem), page: fReusables.page})
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
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
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
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addPermissionItemsResult)
  .setName('Add Permission Items Endpoint')
  .setDescription('Add permission items endpoint.');

export const getEntityPermissionItemsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(permissionItemConstants.routes.getEntityPermissionItems)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getEntityPermissionItemsParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getEntityPermissionItemsResult)
  .setName('Get Entity Permission Items Endpoint')
  .setDescription('Get entity permission items endpoint.');

export const deletePermissionItemsByIdEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(permissionItemConstants.routes.deleteItemsById)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deletePermissionItemsByIdParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('Delete Permission Items Endpoint')
  .setDescription('Delete permission items endpoint.');

export const getResourcePermissionItemsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(permissionItemConstants.routes.getResourcePermissionItems)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getResourcePermissionItemsParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getResourcePermissionItemsResult)
  .setName('Get Resource Permission Items Endpoint')
  .setDescription('Get resource permission items endpoint.');

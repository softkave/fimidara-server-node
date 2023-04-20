import {PublicPermissionItem} from '../../definitions/permissionItem';
import {AppResourceType, getWorkspaceResourceTypeList} from '../../definitions/system';
import {
  FieldArray,
  FieldBoolean,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {
  MddocEndpointRequestHeaders_AuthRequired_ContentType,
  MddocEndpointResponseHeaders_ContentType_ContentLength,
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {AddPermissionItemsEndpointParams, AddPermissionItemsEndpointResult} from './addItems/types';
import {permissionItemConstants} from './constants';
import {DeletePermissionItemInput, DeletePermissionItemsEndpointParams} from './deleteItems/types';
import {DeletePermissionItemsByIdEndpointParams} from './deleteItemsById/types';
import {
  GetEntityPermissionItemsEndpointParams,
  GetEntityPermissionItemsEndpointResult,
} from './getEntityPermissionItems/types';
import {
  GetResourcePermissionItemsEndpointParams,
  GetResourcePermissionItemsEndpointResult,
} from './getResourcePermissionItems/types';
import {PermissionItemInput, PermissionItemInputEntity, PermissionItemInputTarget} from './types';

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
      'Permission entity is a resource granted access. ' +
      'This can be a user, a permission group, a permission item, or a client assigned token.'
  );
const entityType = FieldString.construct()
  .setDescription(
    'Permission entity resource type. ' +
      'Permission entity is the resource granted access. ' +
      'This can be a user, a permission group, a permission item, or a client assigned token.'
  )
  .setValid([AppResourceType.User, AppResourceType.PermissionGroup, AppResourceType.AgentToken])
  .setEnumName('EntityAppResourceType');
const grantAccess = FieldBoolean.construct().setDescription(
  'Whether access is granted or not. ' + 'Access is granted if true, denied if false.'
);
const entity = FieldObject.construct<PermissionItemInputEntity>()
  .setName('NewPermissionItemInputEntity')
  .setFields({
    entityId: FieldObject.requiredField(entityId),
  });

// TODO: add or array to target, container, and entity, and confirm mddoc md
// renderer renders it well.
const target = FieldObject.construct<PermissionItemInputTarget>()
  .setName('NewPermissionItemInputTarget')
  .setFields({
    targetType: FieldObject.optionalField(targetType),
    targetId: FieldObject.requiredField(targetId),
    filepath: FieldObject.optionalField(fReusables.filepath),
    folderpath: FieldObject.optionalField(fReusables.folderpath),
    workspaceRootname: FieldObject.optionalField(fReusables.workspaceRootname),
  });

const deletePermissionItemTarget = FieldObject.construct<Partial<PermissionItemInputTarget>>()
  .setName('DeletePermissionItemInputTarget')
  .setFields({
    targetType: FieldObject.optionalField(targetType),
    targetId: FieldObject.optionalField(targetId),
    filepath: FieldObject.optionalField(fReusables.filepath),
    folderpath: FieldObject.optionalField(fReusables.folderpath),
    workspaceRootname: FieldObject.optionalField(fReusables.workspaceRootname),
  });

const deletePermissionItemInput = FieldObject.construct<DeletePermissionItemInput>()
  .setName('DeletePermissionItemInput')
  .setFields({
    target: FieldObject.requiredField(deletePermissionItemTarget),
    action: FieldObject.optionalField(fReusables.action),
    grantAccess: FieldObject.optionalField(grantAccess),
    entity: FieldObject.optionalField(entity),
    appliesTo: FieldObject.optionalField(fReusables.appliesTo),
  });

const deletePermissionItemInputList = FieldArray.construct()
  .setType(deletePermissionItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsSavedPerRequest);

const newPermissionItemInput = FieldObject.construct<PermissionItemInput>()
  .setName('NewPermissionItemInput')
  .setFields({
    target: FieldObject.requiredField(target),
    grantAccess: FieldObject.requiredField(grantAccess),
    entity: FieldObject.optionalField(entity),
    action: FieldObject.requiredField(fReusables.action),
    appliesTo: FieldObject.requiredField(fReusables.appliesTo),
  });

const newPermissionItemInputList = FieldArray.construct<PermissionItemInput>()
  .setType(newPermissionItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsSavedPerRequest);

const permissionItem = FieldObject.construct<PublicPermissionItem>()
  .setName('PermissionItem')
  .setFields({
    entityId: FieldObject.requiredField(entityId),
    entityType: FieldObject.requiredField(entityType),
    targetType: FieldObject.requiredField(targetType),
    resourceId: FieldObject.requiredField(FieldString.construct()),
    createdBy: FieldObject.requiredField(fReusables.agent),
    createdAt: FieldObject.requiredField(fReusables.date),
    workspaceId: FieldObject.requiredField(fReusables.workspaceId),
    targetId: FieldObject.requiredField(targetId),
    action: FieldObject.requiredField(fReusables.action),
    grantAccess: FieldObject.requiredField(FieldBoolean.construct()),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
    appliesTo: FieldObject.requiredField(fReusables.appliesTo),
  });

export const permissionItemMddocParts = {entityId};

const addPermissionItemsParams = FieldObject.construct<AddPermissionItemsEndpointParams>()
  .setName('AddPermissionItemsEndpointParams')
  .setFields({
    entity: FieldObject.optionalField(entity),
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    items: FieldObject.requiredField(newPermissionItemInputList),
  })
  .setRequired(true)
  .setDescription('Add permission items endpoint params.');
const addPermissionItemsResponseBody = FieldObject.construct<AddPermissionItemsEndpointResult>()
  .setName('AddPermissionItemsEndpointSuccessResult')
  .setFields({
    items: FieldObject.requiredField(
      FieldArray.construct<PublicPermissionItem>().setType(permissionItem)
    ),
  })
  .setRequired(true)
  .setDescription('Add permission items endpoint success result.');

const getResourcePermissionItemsParams =
  FieldObject.construct<GetResourcePermissionItemsEndpointParams>()
    .setName('GetResourcePermissionItemsEndpointParams')
    .setFields({
      target: FieldObject.requiredField(target),
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    })
    .setRequired(true)
    .setDescription(
      'Get resource permission items endpoint params. ' +
        'Returns all the permission items granting access to a resource or resource type.'
    );
const getResourcePermissionItemsResponseBody =
  FieldObject.construct<GetResourcePermissionItemsEndpointResult>()
    .setName('GetResourcePermissionItemsEndpointSuccessResult')
    .setFields({
      items: FieldObject.requiredField(
        FieldArray.construct<PublicPermissionItem>().setType(permissionItem)
      ),
    })
    .setRequired(true)
    .setDescription(
      'Get resource permission items endpoint result. ' +
        'Returns all the permission items granting access to a resource or resource type.'
    );

const getEntityPermissionItemsParams =
  FieldObject.construct<GetEntityPermissionItemsEndpointParams>()
    .setName('getEntityPermissionItemsEndpointParams')
    .setFields({
      entityId: FieldObject.requiredField(entityId),
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
      page: FieldObject.optionalField(fReusables.page),
      pageSize: FieldObject.optionalField(fReusables.pageSize),
    })
    .setRequired(true)
    .setDescription('Get entity permission items endpoint params.');
const getEntityPermissionItemsResponseBody =
  FieldObject.construct<GetEntityPermissionItemsEndpointResult>()
    .setName('getEntityPermissionItemsEndpointSuccessResult')
    .setFields({
      items: FieldObject.requiredField(
        FieldArray.construct<PublicPermissionItem>().setType(permissionItem)
      ),
      page: FieldObject.requiredField(fReusables.page),
    })
    .setRequired(true)
    .setDescription('Get permission items endpoint success result.');

const deletePermissionItemsByIdParams =
  FieldObject.construct<DeletePermissionItemsByIdEndpointParams>()
    .setName('DeletePermissionItemsByIdEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
      itemIds: FieldObject.requiredField(
        FieldArray.construct<string>()
          .setType(fReusables.permissionItemId)
          .setMax(permissionItemConstants.maxPermissionItemsSavedPerRequest)
      ),
    })
    .setRequired(true)
    .setDescription('Delete permission items endpoint params.');

const deletePermissionItemsParams = FieldObject.construct<DeletePermissionItemsEndpointParams>()
  .setName('DeletePermissionItemsEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    items: FieldObject.optionalField(deletePermissionItemInputList),
    entity: FieldObject.optionalField(entity),
  })
  .setRequired(true)
  .setDescription('Delete permission items endpoint params.');

export const addPermissionItemsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: AddPermissionItemsEndpointParams;
  requestHeaders: MddocEndpointRequestHeaders_AuthRequired_ContentType;
}>()
  .setBasePathname(permissionItemConstants.routes.addItems)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addPermissionItemsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setName('AddPermissionItemsEndpoint')
  .setDescription('Add permission items endpoint.');

export const getEntityPermissionItemsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetEntityPermissionItemsEndpointParams;
  requestHeaders: MddocEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetEntityPermissionItemsEndpointResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionItemConstants.routes.getEntityPermissionItems)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getEntityPermissionItemsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getEntityPermissionItemsResponseBody)
  .setName('GetEntityPermissionItemsEndpoint')
  .setDescription('Get entity permission items endpoint.');

export const deletePermissionItemsByIdEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: DeletePermissionItemsByIdEndpointParams;
  requestHeaders: MddocEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionItemConstants.routes.deleteItemsById)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deletePermissionItemsByIdParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeletePermissionItemsEndpoint')
  .setDescription('Delete permission items endpoint.');

export const deletePermissionItemsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: DeletePermissionItemsEndpointParams;
  requestHeaders: MddocEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionItemConstants.routes.deleteItems)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deletePermissionItemsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeletePermissionItemsEndpoint')
  .setDescription('Delete permission items endpoint.');

export const getResourcePermissionItemsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetResourcePermissionItemsEndpointParams;
  requestHeaders: MddocEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetResourcePermissionItemsEndpointResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionItemConstants.routes.getResourcePermissionItems)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getResourcePermissionItemsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getResourcePermissionItemsResponseBody)
  .setName('GetResourcePermissionItemsEndpoint')
  .setDescription('Get resource permission items endpoint.');

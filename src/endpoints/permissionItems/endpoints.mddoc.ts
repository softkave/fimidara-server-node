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
import {multilineTextToParagraph} from '../../utils/fns';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {AddPermissionItemsEndpointParams} from './addItems/types';
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
import {
  ResolveEntityPermissionItemInput,
  ResolveEntityPermissionsEndpointParams,
  ResolveEntityPermissionsEndpointResult,
  ResolvedEntityPermissionItemResult,
  ResolvedEntityPermissionItemTarget,
} from './resolveEntityPermissions/types';
import {PermissionItemInput, PermissionItemInputEntity, PermissionItemInputTarget} from './types';

const targetId = fReusables.workspaceId
  .clone()
  .setDescription('Resource ID permission is effected on.');
const targetType = fReusables.resourceType
  .clone()
  .setDescription(
    multilineTextToParagraph(`
      Resource type permission is effected on. 
      Target ID or other target identifiers like folderpath 
      should be provided when using target type to limit from 
      which target an entity should have or not have access to. 
      When adding permissions, target type without a target identifier will 
      default to workspace. When deleting, target types without a target 
      identifier will delete all permissions with that target type. 
      Having a target type means an entity is granted or denied 
      access to all resources of that type contained within a parent target 
      like all files in a folder, or all folders in a workspace. 
      This is why target ID or a specific target should be provided 
      when adding or removing permissions to avoid granting permissions 
      to all files in a workspace when you only wanted files in a folder. 
      Resource type also works with appliesTo to limit the access to only 
      the target even when target type is set, or to the target and children, 
      or only to children excluding the target itself. 
      The last one is especially useful when you want an entity have 
      access to create or delete folders in a folder but not delete the folder itself.`)
  )
  .setValid(getWorkspaceResourceTypeList())
  .setEnumName('WorkspaceAppResourceType');
const entityId = fReusables.permissionGroupId
  .clone()
  .setDescription(
    'Permission entity resource ID. ' +
      'Permission entity is a resource granted access. ' +
      'This can be a user, a permission group, a permission item, or a agent token.'
  );
const entityType = FieldString.construct()
  .setDescription(
    'Permission entity resource type. ' +
      'Permission entity is the resource granted access. ' +
      'This can be a user, a permission group, a permission item, or a agent token.'
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
    targetId: FieldObject.optionalField(targetId),
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
  .setMax(permissionItemConstants.maxPermissionItemsPerRequest);

const newPermissionItemInput = FieldObject.construct<PermissionItemInput>()
  .setName('NewPermissionItemInput')
  .setFields({
    target: FieldObject.requiredField(target),
    grantAccess: FieldObject.requiredField(grantAccess),
    entity: FieldObject.optionalField(entity),
    action: FieldObject.requiredField(fReusables.action),
    appliesTo: FieldObject.requiredField(fReusables.appliesTo),
  });

const resolvePermissionsItemInput = FieldObject.construct<ResolveEntityPermissionItemInput>()
  .setName('ResolveEntityPermissionItemInput')
  .setFields({
    target: FieldObject.requiredField(target),
    entity: FieldObject.optionalField(entity),
    action: FieldObject.requiredField(fReusables.action),
  });

const resolvedPermissionTarget = FieldObject.construct<ResolvedEntityPermissionItemTarget>()
  .setName('NewPermissionItemInputTarget')
  .setFields({
    targetType: FieldObject.optionalField(targetType),
    targetId: FieldObject.optionalField(targetId),
    filepath: FieldObject.optionalField(fReusables.filepath),
    folderpath: FieldObject.optionalField(fReusables.folderpath),
    workspaceRootname: FieldObject.optionalField(fReusables.workspaceRootname),
  });

const resolvedPermissionItem = FieldObject.construct<ResolvedEntityPermissionItemResult>()
  .setName('ResolveEntityPermissionItemInput')
  .setFields({
    target: FieldObject.requiredField(resolvedPermissionTarget),
    entityId: FieldObject.requiredField(entityId),
    action: FieldObject.requiredField(fReusables.action),
    hasAccess: FieldObject.requiredField(FieldBoolean.construct()),
  });

const newPermissionItemInputList = FieldArray.construct<PermissionItemInput>()
  .setType(newPermissionItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsPerRequest);

const resolvePermissionsItemInputList = FieldArray.construct<ResolveEntityPermissionItemInput>()
  .setType(resolvePermissionsItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsPerRequest);

const resolvedPermissionItemList =
  FieldArray.construct<ResolvedEntityPermissionItemResult>().setType(resolvedPermissionItem);

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
    .setName('GetResourcePermissionItemsEndpointResult')
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

const resolveEntityPermissionsParams =
  FieldObject.construct<ResolveEntityPermissionsEndpointParams>()
    .setName('ResolveEntityPermissionsEndpointParams')
    .setFields({
      entity: FieldObject.optionalField(entity),
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
      items: FieldObject.requiredField(resolvePermissionsItemInputList),
    })
    .setRequired(true)
    .setDescription('Resolve entity permissions endpoint params.');
const resolveEntityPermissionsResponseBody =
  FieldObject.construct<ResolveEntityPermissionsEndpointResult>()
    .setName('ResolveEntityPermissionsEndpointResult')
    .setFields({
      items: FieldObject.requiredField(resolvedPermissionItemList),
    })
    .setRequired(true)
    .setDescription('Resolve entity permissions endpoint result.');

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
    .setName('getEntityPermissionItemsEndpointResult')
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
          .setMax(permissionItemConstants.maxPermissionItemsPerRequest)
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
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
}>()
  .setBasePathname(permissionItemConstants.routes.addItems)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addPermissionItemsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setName('AddPermissionItemsEndpoint')
  .setDescription('Add permission items endpoint.');

export const getEntityPermissionItemsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetEntityPermissionItemsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetEntityPermissionItemsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
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
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
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
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
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
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetResourcePermissionItemsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionItemConstants.routes.getResourcePermissionItems)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getResourcePermissionItemsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getResourcePermissionItemsResponseBody)
  .setName('GetResourcePermissionItemsEndpoint')
  .setDescription('Get resource permission items endpoint.');

export const resolveEntityPermissionsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: ResolveEntityPermissionsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: ResolveEntityPermissionsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionItemConstants.routes.resolveEntityPermissions)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(resolveEntityPermissionsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(resolveEntityPermissionsResponseBody)
  .setName('ResolveEntityPermissionsEndpoint')
  .setDescription('Resolve entity permissions endpoint.');

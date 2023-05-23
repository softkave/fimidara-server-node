import {PublicPermissionItem} from '../../definitions/permissionItem';
import {AppResourceType, getWorkspaceResourceTypeList} from '../../definitions/system';
import {
  FieldArray,
  FieldBoolean,
  FieldObject,
  FieldOrCombination,
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
import {
  DeletePermissionItemInput,
  DeletePermissionItemInputTarget,
  DeletePermissionItemsEndpointParams,
} from './deleteItems/types';
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
  ResolveEntityPermissionItemInputTarget,
  ResolveEntityPermissionsEndpointParams,
  ResolveEntityPermissionsEndpointResult,
  ResolvedEntityPermissionItem,
  ResolvedEntityPermissionItemTarget,
} from './resolveEntityPermissions/types';
import {PermissionItemInput, PermissionItemInputEntity, PermissionItemInputTarget} from './types';

const targetId = fReusables.id.clone().setDescription('Resource ID permission is effected on.');
const targetIdList = FieldArray.construct<string>().setType(targetId);
const targetType = fReusables.resourceType
  .clone()
  .setDescription(
    multilineTextToParagraph(`
      Resource type permission is effected on. 
      Do not pass when checking, adding or deleting permission for a single resource,
      targetId is sufficient for those. Pass targetType to check, add, or delete
      permissions for all resources of type that are children of targetId.`)
  )
  .setValid(getWorkspaceResourceTypeList())
  .setEnumName('WorkspaceAppResourceType');
const targetTypeList = FieldArray.construct<string>().setType(targetType);
const entityId = fReusables.id
  .clone()
  .setDescription(
    'Permission entity resource ID. ' +
      'A permission entity is a resource granted or deny access. ' +
      'This can be a user, a permission group, or an agent token.'
  );
const entityIdList = FieldArray.construct<string>()
  .setType(entityId)
  .setDescription(
    'Permission entity resource ID list. ' +
      'A permission entity is a resource granted or deny access. ' +
      'This can be a user, a permission group, or an agent token.'
  );
const entityIdOrList = FieldOrCombination.construct()
  .setTypes([entityId, FieldArray.construct<string>().setType(entityId)])
  .setDescription(
    'Permission entity resource ID list. ' +
      'A permission entity is a resource granted or deny access. ' +
      'This can be a user, a permission group, or an agent token.'
  );
const entityType = FieldString.construct()
  .setDescription(
    'Permission entity resource type. ' +
      'A permission entity is the resource granted access. ' +
      'This can be a user, a permission group, or an agent token.'
  )
  .setValid([AppResourceType.User, AppResourceType.PermissionGroup, AppResourceType.AgentToken])
  .setEnumName('EntityAppResourceType');
const grantAccess = FieldBoolean.construct().setDescription(
  'Whether access is granted or not. ' + 'Access is granted if true, denied if false.'
);
const grantAccessList = FieldArray.construct<boolean>().setType(grantAccess);
const entity = FieldObject.construct<PermissionItemInputEntity>()
  .setName('PermissionItemInputEntity')
  .setFields({
    entityId: FieldObject.requiredField(entityIdList),
  });

// TODO: add or array to target, container, and entity, and confirm mddoc md
// renderer renders it well.
const target = FieldObject.construct<PermissionItemInputTarget>()
  .setName('PermissionItemInputTarget')
  .setFields({
    targetType: FieldObject.optionalField(targetTypeList),
    targetId: FieldObject.optionalField(targetIdList),
    filepath: FieldObject.optionalField(fReusables.filepathList),
    folderpath: FieldObject.optionalField(fReusables.folderpathList),
    workspaceRootname: FieldObject.optionalField(fReusables.workspaceRootname),
  });
const targetList = FieldArray.construct<PermissionItemInputTarget>().setType(target);

const resolvePermissionsTarget = FieldObject.construct<ResolveEntityPermissionItemInputTarget>()
  .setName('ResolveEntityPermissionItemInputTarget')
  .setFields({
    targetType: FieldObject.optionalField(targetTypeList),
    targetId: FieldObject.optionalField(targetIdList),
    filepath: FieldObject.optionalField(fReusables.filepathList),
    folderpath: FieldObject.optionalField(fReusables.folderpathList),
    workspaceRootname: FieldObject.optionalField(fReusables.workspaceRootname),
  });
const resolvePermissionsTargetList =
  FieldArray.construct<ResolveEntityPermissionItemInputTarget>().setType(resolvePermissionsTarget);

const deletePermissionItemTarget = FieldObject.construct<DeletePermissionItemInputTarget>()
  .setName('DeleteDeletePermissionItemInputTarget')
  .setFields({
    targetType: FieldObject.optionalField(targetTypeList),
    targetId: FieldObject.optionalField(targetIdList),
    filepath: FieldObject.optionalField(fReusables.filepathList),
    folderpath: FieldObject.optionalField(fReusables.folderpathList),
    workspaceRootname: FieldObject.optionalField(fReusables.workspaceRootname),
  });
const deletePermissionItemTargetList =
  FieldArray.construct<DeletePermissionItemInputTarget>().setType(deletePermissionItemTarget);

const deletePermissionItemInput = FieldObject.construct<DeletePermissionItemInput>()
  .setName('DeletePermissionItemInput')
  .setFields({
    target: FieldObject.requiredField(deletePermissionItemTargetList),
    action: FieldObject.optionalField(fReusables.actionList),
    grantAccess: FieldObject.optionalField(grantAccessList),
    entity: FieldObject.optionalField(entity),
    appliesTo: FieldObject.optionalField(fReusables.appliesToList),
  });

const deletePermissionItemInputList = FieldArray.construct()
  .setType(deletePermissionItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsPerRequest);

const newPermissionItemInput = FieldObject.construct<PermissionItemInput>()
  .setName('PermissionItemInput')
  .setFields({
    target: FieldObject.requiredField(targetList),
    grantAccess: FieldObject.requiredField(grantAccess),
    entity: FieldObject.optionalField(entity),
    action: FieldObject.requiredField(fReusables.actionList),
    appliesTo: FieldObject.optionalField(fReusables.appliesToList),
  });

const resolvePermissionsItemInput = FieldObject.construct<ResolveEntityPermissionItemInput>()
  .setName('ResolveEntityPermissionItemInput')
  .setFields({
    target: FieldObject.requiredField(resolvePermissionsTargetList),
    entity: FieldObject.optionalField(entity),
    action: FieldObject.requiredField(fReusables.actionList),
    containerAppliesTo: FieldObject.optionalField(
      fReusables.appliesToList
        .clone()
        .setDescription(
          'Applicable for folders only, for finer control over the appliesTo criteria used to query permission items from parent folders.'
        )
    ),
    targetAppliesTo: FieldObject.optionalField(
      fReusables.appliesToList
        .clone()
        .setDescription(
          'Applicable for folders only, for finer control over the appliesTo criteria used to query permission items belonging to folder.'
        )
    ),
  });

const resolvedPermissionTarget = FieldObject.construct<ResolvedEntityPermissionItemTarget>()
  .setName('ResolvedEntityPermissionItemTarget')
  .setFields({
    targetType: FieldObject.optionalField(targetType),
    targetId: FieldObject.optionalField(targetId),
    filepath: FieldObject.optionalField(fReusables.filepath),
    folderpath: FieldObject.optionalField(fReusables.folderpath),
    workspaceRootname: FieldObject.optionalField(fReusables.workspaceRootname),
  });

const resolvedPermissionItem = FieldObject.construct<ResolvedEntityPermissionItem>()
  .setName('ResolvedEntityPermissionItem')
  .setFields({
    target: FieldObject.requiredField(resolvedPermissionTarget),
    entityId: FieldObject.requiredField(entityId),
    action: FieldObject.requiredField(fReusables.action),
    hasAccess: FieldObject.requiredField(FieldBoolean.construct()),
    targetAppliesTo: FieldObject.optionalField(fReusables.appliesToList),
    containerAppliesTo: FieldObject.optionalField(fReusables.appliesToList),
    accessEntityId: FieldObject.optionalField(
      entityId.clone().setDescription(
        multilineTextToParagraph(`
        ID of the permission entity that directly owns/is assigned the permission item producing this result.
        That is, the permission item used to resolve whether the requested entity has access or does not,
        the entity directly owning that item, is surfaced here as accessEntityId.
        This can be the requested entity itself, or a permission group assigned to the requested entity.
      `)
      )
    ),
    // accessTargetId: FieldObject.optionalField(
    //   targetId.clone().setDescription(
    //     multilineTextToParagraph(`
    //     ID of the permission target that directly owns/is assigned the permission item producing this result.
    //     That is, the permission item used to resolve whether the requested entity has access or does not,
    //     the target directly owning that item, is surfaced here as accessTargetId.
    //     This can be the requested target itself, or a parent folder if the requested resource is a folder of file, etc.
    //   `)
    //   )
    // ),
    // accessTargetType: FieldObject.optionalField(
    //   targetType.clone().setDescription(
    //     multilineTextToParagraph(`
    //     Resource type specified in the permission item producing this result.
    //     This can be the the type of the target or a children type if the target ID
    //     is a container resource like workspace or folder.
    //   `)
    //   )
    // ),
  });

const newPermissionItemInputList = FieldArray.construct<PermissionItemInput>()
  .setType(newPermissionItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsPerRequest);

const resolvePermissionsItemInputList = FieldArray.construct<ResolveEntityPermissionItemInput>()
  .setType(resolvePermissionsItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsPerRequest);

const resolvedPermissionItemList =
  FieldArray.construct<ResolvedEntityPermissionItem>().setType(resolvedPermissionItem);

const permissionItem = FieldObject.construct<PublicPermissionItem>()
  .setName('PermissionItem')
  .setFields({
    entityId: FieldObject.requiredField(entityId),
    entityType: FieldObject.requiredField(entityType),
    targetParentId: FieldObject.requiredField(
      targetId.clone().setDescription(
        multilineTextToParagraph(
          `ID of the closest parent of target. For files and folders, 
          this could be another folder, or the workspace. For other resources, 
          this will be the workspace.`
        )
      )
    ),
    targetParentType: FieldObject.requiredField(
      targetType.clone().setDescription(
        multilineTextToParagraph(
          `Resource type of the closest parent of target. For files and folders, 
          this could be another folder, or the workspace. For other resources, 
          this will be the workspace.`
        )
      )
    ),
    targetId: FieldObject.requiredField(targetId),
    targetType: FieldObject.requiredField(targetType),
    resourceId: FieldObject.requiredField(FieldString.construct()),
    createdBy: FieldObject.requiredField(fReusables.agent),
    createdAt: FieldObject.requiredField(fReusables.date),
    workspaceId: FieldObject.requiredField(fReusables.workspaceId),
    action: FieldObject.requiredField(fReusables.action),
    grantAccess: FieldObject.requiredField(FieldBoolean.construct()),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
    appliesTo: FieldObject.requiredField(fReusables.appliesTo),
  });

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

export const permissionItemMddocParts = {entityId, entityIdOrList, entityIdList};

import {PublicPermissionItem} from '../../definitions/permissionItem';
import {AppResourceType, getWorkspaceResourceTypeList} from '../../definitions/system';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {multilineTextToParagraph} from '../../utils/fns';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
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
import {
  AddPermissionItemsHttpEndpoint,
  DeletePermissionItemsHttpEndpoint,
  PermissionItemInput,
  PermissionItemInputEntity,
  PermissionItemInputTarget,
  ResolveEntityPermissionsHttpEndpoint,
} from './types';

const targetId = fReusables.id
  .clone()
  .setDescription('Resource ID permission is effected on.');
const targetIdList = mddocConstruct.constructFieldArray<string>().setType(targetId);
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
const targetTypeList = mddocConstruct.constructFieldArray<string>().setType(targetType);
const entityId = fReusables.id
  .clone()
  .setDescription(
    'Permission entity resource ID. ' +
      'A permission entity is a resource granted or deny access. ' +
      'This can be a user, a permission group, or an agent token.'
  );
const entityIdList = mddocConstruct
  .constructFieldArray<string>()
  .setType(entityId)
  .setDescription(
    'Permission entity resource ID list. ' +
      'A permission entity is a resource granted or deny access. ' +
      'This can be a user, a permission group, or an agent token.'
  );
const entityIdOrList = mddocConstruct
  .constructFieldOrCombination()
  .setTypes([entityId, mddocConstruct.constructFieldArray<string>().setType(entityId)])
  .setDescription(
    'Permission entity resource ID list. ' +
      'A permission entity is a resource granted or deny access. ' +
      'This can be a user, a permission group, or an agent token.'
  );
const entityType = mddocConstruct
  .constructFieldString()
  .setDescription(
    'Permission entity resource type. ' +
      'A permission entity is the resource granted access. ' +
      'This can be a user, a permission group, or an agent token.'
  )
  .setValid([
    AppResourceType.User,
    AppResourceType.PermissionGroup,
    AppResourceType.AgentToken,
  ])
  .setEnumName('EntityAppResourceType');
const grantAccess = mddocConstruct
  .constructFieldBoolean()
  .setDescription(
    'Whether access is granted or not. ' + 'Access is granted if true, denied if false.'
  );
const grantAccessList = mddocConstruct
  .constructFieldArray<boolean>()
  .setType(grantAccess);
const entity = mddocConstruct
  .constructFieldObject<PermissionItemInputEntity>()
  .setName('PermissionItemInputEntity')
  .setFields({
    entityId: mddocConstruct.constructFieldObjectField(true, entityIdList),
  });

// TODO: add or array to target, container, and entity, and confirm mddoc md
// renderer renders it well.
const target = mddocConstruct
  .constructFieldObject<PermissionItemInputTarget>()
  .setName('PermissionItemInputTarget')
  .setFields({
    targetType: mddocConstruct.constructFieldObjectField(false, targetTypeList),
    targetId: mddocConstruct.constructFieldObjectField(false, targetIdList),
    filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepathList),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpathList
    ),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
  });
const targetList = mddocConstruct
  .constructFieldArray<PermissionItemInputTarget>()
  .setType(target);

const resolvePermissionsTarget = mddocConstruct
  .constructFieldObject<ResolveEntityPermissionItemInputTarget>()
  .setName('ResolveEntityPermissionItemInputTarget')
  .setFields({
    targetType: mddocConstruct.constructFieldObjectField(false, targetTypeList),
    targetId: mddocConstruct.constructFieldObjectField(false, targetIdList),
    filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepathList),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpathList
    ),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
  });
const resolvePermissionsTargetList = mddocConstruct
  .constructFieldArray<ResolveEntityPermissionItemInputTarget>()
  .setType(resolvePermissionsTarget);

const deletePermissionItemTarget = mddocConstruct
  .constructFieldObject<DeletePermissionItemInputTarget>()
  .setName('DeleteDeletePermissionItemInputTarget')
  .setFields({
    targetType: mddocConstruct.constructFieldObjectField(false, targetTypeList),
    targetId: mddocConstruct.constructFieldObjectField(false, targetIdList),
    filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepathList),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpathList
    ),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
  });
const deletePermissionItemTargetList = mddocConstruct
  .constructFieldArray<DeletePermissionItemInputTarget>()
  .setType(deletePermissionItemTarget);

const deletePermissionItemInput = mddocConstruct
  .constructFieldObject<DeletePermissionItemInput>()
  .setName('DeletePermissionItemInput')
  .setFields({
    target: mddocConstruct.constructFieldObjectField(
      true,
      deletePermissionItemTargetList
    ),
    action: mddocConstruct.constructFieldObjectField(false, fReusables.actionList),
    access: mddocConstruct.constructFieldObjectField(false, grantAccessList),
    entityId: mddocConstruct.constructFieldObjectField(false, entity),
    appliesTo: mddocConstruct.constructFieldObjectField(false, fReusables.appliesToList),
  });

const deletePermissionItemInputList = mddocConstruct
  .constructFieldArray<DeletePermissionItemInput>()
  .setType(deletePermissionItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsPerRequest);

const newPermissionItemInput = mddocConstruct
  .constructFieldObject<PermissionItemInput>()
  .setName('PermissionItemInput')
  .setFields({
    target: mddocConstruct.constructFieldObjectField(true, targetList),
    access: mddocConstruct.constructFieldObjectField(true, grantAccess),
    entity: mddocConstruct.constructFieldObjectField(false, entity),
    action: mddocConstruct.constructFieldObjectField(true, fReusables.actionList),
    appliesTo: mddocConstruct.constructFieldObjectField(false, fReusables.appliesToList),
  });

const resolvePermissionsItemInput = mddocConstruct
  .constructFieldObject<ResolveEntityPermissionItemInput>()
  .setName('ResolveEntityPermissionItemInput')
  .setFields({
    target: mddocConstruct.constructFieldObjectField(true, resolvePermissionsTargetList),
    entityId: mddocConstruct.constructFieldObjectField(false, entity),
    action: mddocConstruct.constructFieldObjectField(true, fReusables.actionList),
    containerAppliesTo: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.appliesToList
        .clone()
        .setDescription(
          'Applicable for folders only, for finer control over the appliesTo criteria used to query permission items from parent folders.'
        )
    ),
    targetAppliesTo: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.appliesToList
        .clone()
        .setDescription(
          'Applicable for folders only, for finer control over the appliesTo criteria used to query permission items belonging to folder.'
        )
    ),
  });

const resolvedPermissionTarget = mddocConstruct
  .constructFieldObject<ResolvedEntityPermissionItemTarget>()
  .setName('ResolvedEntityPermissionItemTarget')
  .setFields({
    targetType: mddocConstruct.constructFieldObjectField(false, targetType),
    targetId: mddocConstruct.constructFieldObjectField(false, targetId),
    filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepath),
    folderpath: mddocConstruct.constructFieldObjectField(false, fReusables.folderpath),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
  });

const resolvedPermissionItem = mddocConstruct
  .constructFieldObject<ResolvedEntityPermissionItem>()
  .setName('ResolvedEntityPermissionItem')
  .setFields({
    target: mddocConstruct.constructFieldObjectField(true, resolvedPermissionTarget),
    entityId: mddocConstruct.constructFieldObjectField(true, entityId),
    action: mddocConstruct.constructFieldObjectField(true, fReusables.action),
    hasAccess: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldBoolean()
    ),
    targetAppliesTo: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.appliesToList
    ),
    containerAppliesTo: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.appliesToList
    ),
    permittingEntityId: mddocConstruct.constructFieldObjectField(
      false,
      entityId.clone().setDescription(
        multilineTextToParagraph(`
        ID of the permission entity that directly owns/is assigned the permission item producing this result.
        That is, the permission item used to resolve whether the requested entity has access or does not,
        the entity directly owning that item, is surfaced here as accessEntityId.
        This can be the requested entity itself, or a permission group assigned to the requested entity.
      `)
      )
    ),
    // accessTargetId: mddocConstruct.constructFieldObjectField(false,
    //   targetId.clone().setDescription(
    //     multilineTextToParagraph(`
    //     ID of the permission target that directly owns/is assigned the permission item producing this result.
    //     That is, the permission item used to resolve whether the requested entity has access or does not,
    //     the target directly owning that item, is surfaced here as accessTargetId.
    //     This can be the requested target itself, or a parent folder if the requested resource is a folder of file, etc.
    //   `)
    //   )
    // ),
    // accessTargetType: mddocConstruct.constructFieldObjectField(false,
    //   targetType.clone().setDescription(
    //     multilineTextToParagraph(`
    //     Resource type specified in the permission item producing this result.
    //     This can be the the type of the target or a children type if the target ID
    //     is a container resource like workspace or folder.
    //   `)
    //   )
    // ),
  });

const newPermissionItemInputList = mddocConstruct
  .constructFieldArray<PermissionItemInput>()
  .setType(newPermissionItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsPerRequest);

const resolvePermissionsItemInputList = mddocConstruct
  .constructFieldArray<ResolveEntityPermissionItemInput>()
  .setType(resolvePermissionsItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsPerRequest);

const resolvedPermissionItemList = mddocConstruct
  .constructFieldArray<ResolvedEntityPermissionItem>()
  .setType(resolvedPermissionItem);

const permissionItem = mddocConstruct
  .constructFieldObject<PublicPermissionItem>()
  .setName('PermissionItem')
  .setFields({
    entityId: mddocConstruct.constructFieldObjectField(true, entityId),
    entityType: mddocConstruct.constructFieldObjectField(true, entityType),
    targetParentId: mddocConstruct.constructFieldObjectField(
      true,
      targetId.clone().setDescription(
        multilineTextToParagraph(
          `ID of the closest parent of target. For files and folders, 
          this could be another folder, or the workspace. For other resources, 
          this will be the workspace.`
        )
      )
    ),
    targetParentType: mddocConstruct.constructFieldObjectField(
      true,
      targetType.clone().setDescription(
        multilineTextToParagraph(
          `Resource type of the closest parent of target. For files and folders, 
          this could be another folder, or the workspace. For other resources, 
          this will be the workspace.`
        )
      )
    ),
    targetId: mddocConstruct.constructFieldObjectField(true, targetId),
    targetType: mddocConstruct.constructFieldObjectField(true, targetType),
    resourceId: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldString()
    ),
    createdBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    createdAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceId),
    action: mddocConstruct.constructFieldObjectField(true, fReusables.action),
    access: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldBoolean()
    ),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceId
    ),
    appliesTo: mddocConstruct.constructFieldObjectField(true, fReusables.appliesTo),
  });

const addPermissionItemsParams = mddocConstruct
  .constructFieldObject<AddPermissionItemsEndpointParams>()
  .setName('AddPermissionItemsEndpointParams')
  .setFields({
    entity: mddocConstruct.constructFieldObjectField(false, entity),
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    items: mddocConstruct.constructFieldObjectField(true, newPermissionItemInputList),
  })
  .setDescription('Add permission items endpoint params.');

const getResourcePermissionItemsParams = mddocConstruct
  .constructFieldObject<GetResourcePermissionItemsEndpointParams>()
  .setName('GetResourcePermissionItemsEndpointParams')
  .setFields({
    target: mddocConstruct.constructFieldObjectField(true, target),
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  })
  .setDescription(
    'Get resource permission items endpoint params. ' +
      'Returns all the permission items granting access to a resource or resource type.'
  );
const getResourcePermissionItemsResponseBody = mddocConstruct
  .constructFieldObject<GetResourcePermissionItemsEndpointResult>()
  .setName('GetResourcePermissionItemsEndpointResult')
  .setFields({
    items: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicPermissionItem>().setType(permissionItem)
    ),
  })
  .setDescription(
    'Get resource permission items endpoint result. ' +
      'Returns all the permission items granting access to a resource or resource type.'
  );

const resolveEntityPermissionsParams = mddocConstruct
  .constructFieldObject<ResolveEntityPermissionsEndpointParams>()
  .setName('ResolveEntityPermissionsEndpointParams')
  .setFields({
    entity: mddocConstruct.constructFieldObjectField(false, entity),
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    items: mddocConstruct.constructFieldObjectField(
      true,
      resolvePermissionsItemInputList
    ),
  })
  .setDescription('Resolve entity permissions endpoint params.');
const resolveEntityPermissionsResponseBody = mddocConstruct
  .constructFieldObject<ResolveEntityPermissionsEndpointResult>()
  .setName('ResolveEntityPermissionsEndpointResult')
  .setFields({
    items: mddocConstruct.constructFieldObjectField(true, resolvedPermissionItemList),
  })
  .setDescription('Resolve entity permissions endpoint result.');

const getEntityPermissionItemsParams = mddocConstruct
  .constructFieldObject<GetEntityPermissionItemsEndpointParams>()
  .setName('getEntityPermissionItemsEndpointParams')
  .setFields({
    entityId: mddocConstruct.constructFieldObjectField(true, entityId),
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(false, fReusables.pageSize),
  })
  .setDescription('Get entity permission items endpoint params.');
const getEntityPermissionItemsResponseBody = mddocConstruct
  .constructFieldObject<GetEntityPermissionItemsEndpointResult>()
  .setName('getEntityPermissionItemsEndpointResult')
  .setFields({
    items: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicPermissionItem>().setType(permissionItem)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  })
  .setDescription('Get permission items endpoint success result.');

const deletePermissionItemsByIdParams = mddocConstruct
  .constructFieldObject<DeletePermissionItemsByIdEndpointParams>()
  .setName('DeletePermissionItemsByIdEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    itemIds: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<string>()
        .setType(fReusables.permissionItemId)
        .setMax(permissionItemConstants.maxPermissionItemsPerRequest)
    ),
  })
  .setDescription('Delete permission items endpoint params.');

const deletePermissionItemsParams = mddocConstruct
  .constructFieldObject<DeletePermissionItemsEndpointParams>()
  .setName('DeletePermissionItemsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    items: mddocConstruct.constructFieldObjectField(false, deletePermissionItemInputList),
    entity: mddocConstruct.constructFieldObjectField(false, entity),
  })
  .setDescription('Delete permission items endpoint params.');

export const addPermissionItemsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddPermissionItemsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddPermissionItemsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<AddPermissionItemsHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      AddPermissionItemsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AddPermissionItemsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      AddPermissionItemsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionItemConstants.routes.addItems)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addPermissionItemsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setName('AddPermissionItemsEndpoint')
  .setDescription('Add permission items endpoint.');

export const deletePermissionItemsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      DeletePermissionItemsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      DeletePermissionItemsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      DeletePermissionItemsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      DeletePermissionItemsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeletePermissionItemsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      DeletePermissionItemsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionItemConstants.routes.deleteItems)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deletePermissionItemsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeletePermissionItemsEndpoint')
  .setDescription('Delete permission items endpoint.');

export const resolveEntityPermissionsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      ResolveEntityPermissionsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      ResolveEntityPermissionsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      ResolveEntityPermissionsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      ResolveEntityPermissionsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      ResolveEntityPermissionsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      ResolveEntityPermissionsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionItemConstants.routes.resolveEntityPermissions)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(resolveEntityPermissionsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(resolveEntityPermissionsResponseBody)
  .setName('ResolveEntityPermissionsEndpoint')
  .setDescription('Resolve entity permissions endpoint.');

export const permissionItemMddocParts = {entityId, entityIdOrList, entityIdList};

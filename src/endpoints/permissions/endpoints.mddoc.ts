import {
  PermissionGroupMatcher,
  PublicAssignedPermissionGroupMeta,
  PublicPermissionGroup,
} from '../../definitions/permissionGroups.js';
import {
  FieldObjectFieldsMap,
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {multilineTextToParagraph} from '../../utils/fns.js';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc.js';
import {permissionItemMddocParts} from '../permissions/endpoints.mddoc.js';
import {
  AddPermissionGroupEndpointParams,
  AddPermissionGroupEndpointResult,
} from './addPermissionGroup/types.js';
import {AddPermissionItemsEndpointParams} from './addPermissionItems/types.js';
import {AssignPermissionGroupsEndpointParams} from './assignPermissionGroups/types.js';
import {
  permissionGroupConstants,
  permissionItemConstants,
} from './constants.js';
import {CountWorkspacePermissionGroupsEndpointParams} from './countPermissionGroups/types.js';
import {DeletePermissionGroupEndpointParams} from './deletePermissionGroup/types.js';
import {
  DeletePermissionItemInput,
  DeletePermissionItemsEndpointParams,
} from './deletePermissionItems/types.js';
import {
  GetEntityAssignedPermissionGroupsEndpointParams,
  GetEntityAssignedPermissionGroupsEndpointResult,
} from './getAssignedPermissionGroups/types.js';
import {
  GetPermissionGroupEndpointParams,
  GetPermissionGroupEndpointResult,
} from './getPermissionGroup/types.js';
import {
  GetWorkspacePermissionGroupsEndpointParams,
  GetWorkspacePermissionGroupsEndpointResult,
} from './getPermissionGroups/types.js';
import {
  ResolveEntityPermissionItemInput,
  ResolveEntityPermissionsEndpointParams,
  ResolveEntityPermissionsEndpointResult,
  ResolvedEntityPermissionItem,
  ResolvedEntityPermissionItemTarget,
} from './resolvePermissions/types.js';
import {
  AddPermissionGroupHttpEndpoint,
  AddPermissionItemsHttpEndpoint,
  AssignPermissionGroupsHttpEndpoint,
  CountWorkspacePermissionGroupsHttpEndpoint,
  DeletePermissionGroupHttpEndpoint,
  DeletePermissionItemsHttpEndpoint,
  GetEntityAssignedPermissionGroupsHttpEndpoint,
  GetPermissionGroupHttpEndpoint,
  GetWorkspacePermissionGroupsHttpEndpoint,
  PermissionItemInput,
  ResolveEntityPermissionsHttpEndpoint,
  UnassignPermissionGroupsHttpEndpoint,
  UpdatePermissionGroupHttpEndpoint,
} from './types.js';
import {UnassignPermissionGroupsEndpointParams} from './unassignPermissionGroups/types.js';
import {
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupEndpointResult,
  UpdatePermissionGroupInput,
} from './updatePermissionGroup/types.js';

const targetId = fReusables.id
  .clone()
  .setDescription('Resource ID permission is effected on');
const targetIdList = mddocConstruct
  .constructFieldArray<string>()
  .setType(targetId);
const targetIdOrList = mddocConstruct
  .constructFieldOrCombination<string | string[]>()
  .setTypes([targetId, targetIdList]);
const entityId = fReusables.id
  .clone()
  .setDescription(
    'Permission entity resource ID. ' +
      'A permission entity is a resource granted or deny access. ' +
      'This can be a user, a permission group, or an agent token'
  );
const entityIdList = mddocConstruct
  .constructFieldArray<string>()
  .setType(entityId)
  .setDescription(
    'Permission entity resource ID list. ' +
      'A permission entity is a resource granted or deny access. ' +
      'This can be a user, a permission group, or an agent token'
  );
const entityIdOrList = mddocConstruct
  .constructFieldOrCombination<string | string[]>()
  .setTypes([entityId, entityIdList])
  .setDescription(
    'Permission entity resource ID list. ' +
      'A permission entity is a resource granted or deny access. ' +
      'This can be a user, a permission group, or an agent token'
  );
const grantAccess = mddocConstruct
  .constructFieldBoolean()
  .setDescription(
    'Whether access is granted or not. ' +
      'Access is granted if true, denied if false'
  );

const deletePermissionItemInput = mddocConstruct
  .constructFieldObject<DeletePermissionItemInput>()
  .setName('DeletePermissionItemInput')
  .setFields({
    targetId: mddocConstruct.constructFieldObjectField(false, targetIdOrList),
    filepath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.filepathOrList
    ),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpathOrList
    ),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
    action: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.actionOrList
    ),
    access: mddocConstruct.constructFieldObjectField(false, grantAccess),
    entityId: mddocConstruct.constructFieldObjectField(false, entityIdOrList),
  });

const deletePermissionItemInputList = mddocConstruct
  .constructFieldArray<DeletePermissionItemInput>()
  .setType(deletePermissionItemInput)
  .setMax(permissionItemConstants.maxPermissionItemsPerRequest);

const newPermissionItemInput = mddocConstruct
  .constructFieldObject<PermissionItemInput>()
  .setName('PermissionItemInput')
  .setFields({
    targetId: mddocConstruct.constructFieldObjectField(false, targetIdOrList),
    filepath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.filepathOrList
    ),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpathOrList
    ),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
    access: mddocConstruct.constructFieldObjectField(true, grantAccess),
    entityId: mddocConstruct.constructFieldObjectField(true, entityIdOrList),
    action: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.actionOrList
    ),
  });

const resolvePermissionsItemInput = mddocConstruct
  .constructFieldObject<ResolveEntityPermissionItemInput>()
  .setName('ResolveEntityPermissionItemInput')
  .setFields({
    targetId: mddocConstruct.constructFieldObjectField(false, targetIdOrList),
    filepath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.filepathOrList
    ),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpathOrList
    ),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
    entityId: mddocConstruct.constructFieldObjectField(true, entityIdOrList),
    action: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.actionOrList
    ),
  });

const resolvedPermissionTarget = mddocConstruct
  .constructFieldObject<ResolvedEntityPermissionItemTarget>()
  .setName('ResolvedEntityPermissionItemTarget')
  .setFields({
    targetId: mddocConstruct.constructFieldObjectField(false, targetId),
    filepath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.filepath
    ),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpath
    ),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
  });

const resolvedPermissionItem = mddocConstruct
  .constructFieldObject<ResolvedEntityPermissionItem>()
  .setName('ResolvedEntityPermissionItem')
  .setFields({
    target: mddocConstruct.constructFieldObjectField(
      true,
      resolvedPermissionTarget
    ),
    entityId: mddocConstruct.constructFieldObjectField(true, entityId),
    action: mddocConstruct.constructFieldObjectField(true, fReusables.action),
    access: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldBoolean()
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
    permittingTargetId: mddocConstruct.constructFieldObjectField(
      false,
      targetId.clone().setDescription(
        multilineTextToParagraph(`
        ID of the permission target that directly owns/is assigned the permission item producing this result.
        That is, the permission item used to resolve whether the requested entity has access or does not,
        the target directly owning that item, is surfaced here as permittingTargetId.
        This can be the requested target itself, or a parent folder if the requested resource is a folder of file, etc.
      `)
      )
    ),
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

const permissionGroup = mddocConstruct
  .constructFieldObject<PublicPermissionGroup>()
  .setName('PermissionGroup')
  .setFields({
    ...fReusables.workspaceResourceParts,
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
  });

const assignedPermissionGroupMeta = mddocConstruct
  .constructFieldObject<PublicAssignedPermissionGroupMeta>()
  .setName('PublicAssignedPermissionGroupMeta')
  .setFields({
    permissionGroupId: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.permissionGroupId
    ),
    assignedBy: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.agent
    ),
    assignedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    assigneeId: mddocConstruct.constructFieldObjectField(
      true,
      permissionItemMddocParts.entityId
    ),
  });

const permissionGroupId = fReusables.permissionGroupId
  .clone()
  .setDescription(
    'Permission group ID. Either provide the permission group ID, or provide the workspace ID and permission group name'
  );
const name = fReusables.name
  .clone()
  .setDescription(
    'Permission group name. Either provide the permission group ID, or provide the workspace ID and permission group name'
  );
const workspaceIdInput = fReusables.workspaceIdInput
  .clone()
  .setDescription(
    fReusables.workspaceIdInput.assertGetDescription() +
      'Either provide the permission group ID, or provide the workspace ID and permission group name'
  );

const permissionGroupMatcherParts: FieldObjectFieldsMap<PermissionGroupMatcher> =
  {
    permissionGroupId: mddocConstruct.constructFieldObjectField(
      false,
      permissionGroupId
    ),
    name: mddocConstruct.constructFieldObjectField(false, name),
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      workspaceIdInput
    ),
  };

const addPermissionGroupParams = mddocConstruct
  .constructFieldObject<AddPermissionGroupEndpointParams>()
  .setName('AddPermissionGroupEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
  });
const addPermissionGroupResponseBody = mddocConstruct
  .constructFieldObject<AddPermissionGroupEndpointResult>()
  .setName('AddPermissionGroupEndpointResult')
  .setFields({
    permissionGroup: mddocConstruct.constructFieldObjectField(
      true,
      permissionGroup
    ),
  });
const getWorkspacePermissionGroupsParams = mddocConstruct
  .constructFieldObject<GetWorkspacePermissionGroupsEndpointParams>()
  .setName('GetWorkspacePermissionGroupsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.pageSize
    ),
  });
const getWorkspacePermissionGroupsResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspacePermissionGroupsEndpointResult>()
  .setName('GetWorkspacePermissionGroupsEndpointResult')
  .setFields({
    permissionGroups: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<PublicPermissionGroup>()
        .setType(permissionGroup)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  });
const getEntityAssignedPermissionGroupsParams = mddocConstruct
  .constructFieldObject<GetEntityAssignedPermissionGroupsEndpointParams>()
  .setName('GetEntityAssignedPermissionGroupsParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    entityId: mddocConstruct.constructFieldObjectField(
      true,
      permissionItemMddocParts.entityId
    ),
    includeInheritedPermissionGroups: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldBoolean()
        .setDescription(
          'Whether to include permission groups not directly assigned but inherited through permission groups assigned to entity'
        )
    ),
  });
const getEntityAssignedPermissionGroupsResponseBody = mddocConstruct
  .constructFieldObject<GetEntityAssignedPermissionGroupsEndpointResult>()
  .setName('GetEntityAssignedPermissionGroupsEndpointResult')
  .setFields({
    permissionGroups: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<PublicPermissionGroup>()
        .setType(permissionGroup)
    ),
    immediateAssignedPermissionGroupsMeta:
      mddocConstruct.constructFieldObjectField(
        true,
        mddocConstruct
          .constructFieldArray<PublicAssignedPermissionGroupMeta>()
          .setType(assignedPermissionGroupMeta)
      ),
  });
const countWorkspacePermissionGroupsParams = mddocConstruct
  .constructFieldObject<CountWorkspacePermissionGroupsEndpointParams>()
  .setName('CountWorkspacePermissionGroupsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });
const updatePermissionGroupParams = mddocConstruct
  .constructFieldObject<UpdatePermissionGroupEndpointParams>()
  .setName('UpdatePermissionGroupEndpointParams')
  .setFields({
    ...permissionGroupMatcherParts,
    data: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldObject<UpdatePermissionGroupInput>()
        .setFields({
          name: mddocConstruct.constructFieldObjectField(
            false,
            fReusables.name
          ),
          description: mddocConstruct.constructFieldObjectField(
            false,
            fReusables.description
          ),
        })
        .setName('UpdatePermissionGroupInput')
    ),
  });
const updatePermissionGroupResponseBody = mddocConstruct
  .constructFieldObject<UpdatePermissionGroupEndpointResult>()
  .setName('UpdatePermissionGroupEndpointResult')
  .setFields({
    permissionGroup: mddocConstruct.constructFieldObjectField(
      true,
      permissionGroup
    ),
  });
const assignPermissionGroupsParams = mddocConstruct
  .constructFieldObject<AssignPermissionGroupsEndpointParams>()
  .setName('AssignPermissionGroupsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    entityId: mddocConstruct.constructFieldObjectField(
      true,
      permissionItemMddocParts.entityIdOrList
    ),
    permissionGroupId: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.idOrList
    ),
  });
const unassignPermissionGroupsParams = mddocConstruct
  .constructFieldObject<UnassignPermissionGroupsEndpointParams>()
  .setName('UnassignPermissionGroupsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    entityId: mddocConstruct.constructFieldObjectField(
      true,
      permissionItemMddocParts.entityIdOrList
    ),
    permissionGroupId: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldOrCombination<string | string[]>()
        .setTypes([
          fReusables.id.clone().setDescription('Permission group ID'),
          fReusables.idList
            .clone()
            .setDescription('List of permission group IDs'),
        ])
    ),
  });
const getPermissionGroupParams = mddocConstruct
  .constructFieldObject<GetPermissionGroupEndpointParams>()
  .setName('GetPermissionGroupEndpointParams')
  .setFields(permissionGroupMatcherParts);
const getPermissionGroupResponseBody = mddocConstruct
  .constructFieldObject<GetPermissionGroupEndpointResult>()
  .setName('GetPermissionGroupEndpointResult')
  .setFields({
    permissionGroup: mddocConstruct.constructFieldObjectField(
      true,
      permissionGroup
    ),
  });
const deletePermissionGroupParams = mddocConstruct
  .constructFieldObject<DeletePermissionGroupEndpointParams>()
  .setName('DeletePermissionGroupEndpointParams')
  .setFields(permissionGroupMatcherParts);

const addPermissionItemsParams = mddocConstruct
  .constructFieldObject<AddPermissionItemsEndpointParams>()
  .setName('AddPermissionItemsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    items: mddocConstruct.constructFieldObjectField(
      true,
      newPermissionItemInputList
    ),
  });
const resolveEntityPermissionsParams = mddocConstruct
  .constructFieldObject<ResolveEntityPermissionsEndpointParams>()
  .setName('ResolveEntityPermissionsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    items: mddocConstruct.constructFieldObjectField(
      true,
      resolvePermissionsItemInputList
    ),
  });
const resolveEntityPermissionsResponseBody = mddocConstruct
  .constructFieldObject<ResolveEntityPermissionsEndpointResult>()
  .setName('ResolveEntityPermissionsEndpointResult')
  .setFields({
    items: mddocConstruct.constructFieldObjectField(
      true,
      resolvedPermissionItemList
    ),
  });
const deletePermissionItemsParams = mddocConstruct
  .constructFieldObject<DeletePermissionItemsEndpointParams>()
  .setName('DeletePermissionItemsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    items: mddocConstruct.constructFieldObjectField(
      true,
      deletePermissionItemInputList
    ),
  });
export const addPermissionItemsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddPermissionItemsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddPermissionItemsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      AddPermissionItemsHttpEndpoint['mddocHttpDefinition']['query']
    >,
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
  .setName('AddPermissionItemsEndpoint');

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
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(
    mddocEndpointHttpResponseItems.multipleLongRunningJobResponseBody
  )
  .setName('DeletePermissionItemsEndpoint');

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
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(resolveEntityPermissionsResponseBody)
  .setName('ResolveEntityPermissionsEndpoint');

export const addPermissionGroupEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.addPermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addPermissionGroupParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(addPermissionGroupResponseBody)
  .setName('AddPermissionGroupEndpoint');

export const getPermissionGroupEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.getPermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getPermissionGroupParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getPermissionGroupResponseBody)
  .setName('GetPermissionGroupEndpoint');

export const updatePermissionGroupEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.updatePermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updatePermissionGroupParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(updatePermissionGroupResponseBody)
  .setName('UpdatePermissionGroupEndpoint');

export const deletePermissionGroupEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.deletePermissionGroup)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deletePermissionGroupParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeletePermissionGroupEndpoint');

export const getWorkspacePermissionGroupsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.getWorkspacePermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspacePermissionGroupsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getWorkspacePermissionGroupsResponseBody)
  .setName('GetWorkspacePermissionGroupsEndpoint');

export const countWorkspacePermissionGroupsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(
    permissionGroupConstants.routes.countWorkspacePermissionGroups
  )
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspacePermissionGroupsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspacePermissionGroupsEndpoint');

export const assignPermissionGroupsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.assignPermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(assignPermissionGroupsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setName('AssignPermissionGroupsEndpoint');

export const unassignPermissionGroupsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.unassignPermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(unassignPermissionGroupsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setName('UnassignPermissionGroupsEndpoint');

export const getEntityAssignedPermissionGroupsEndpointDefinition =
  mddocConstruct
    .constructHttpEndpointDefinition<
      InferFieldObjectType<
        GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
      >,
      InferFieldObjectType<
        GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
      >,
      InferFieldObjectType<
        GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['query']
      >,
      InferFieldObjectOrMultipartType<
        GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestBody']
      >,
      InferFieldObjectType<
        GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
      >,
      InferFieldObjectType<
        GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseBody']
      >
    >()
    .setBasePathname(
      permissionGroupConstants.routes.getEntityAssignedPermissionGroups
    )
    .setMethod(HttpEndpointMethod.Post)
    .setRequestBody(getEntityAssignedPermissionGroupsParams)
    .setRequestHeaders(
      mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
    )
    .setResponseHeaders(
      mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
    )
    .setResponseBody(getEntityAssignedPermissionGroupsResponseBody)
    .setName('GetEntityAssignedPermissionGroupsEndpoint');

export const permissionItemMddocParts = {
  entityId,
  entityIdOrList,
  entityIdList,
};

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
  PermissionItemInputTarget,
  ResolveEntityPermissionsHttpEndpoint,
} from './types';

const targetId = fReusables.id
  .clone()
  .setDescription('Resource ID permission is effected on');
const targetIdList = mddocConstruct.constructFieldArray<string>().setType(targetId);
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
    'Whether access is granted or not. ' + 'Access is granted if true, denied if false'
  );

// TODO: add or array to target, container, and entity, and confirm mddoc md
// renderer renders it well.
const target = mddocConstruct
  .constructFieldObject<PermissionItemInputTarget>()
  .setName('PermissionItemInputTarget')
  .setFields({
    targetId: mddocConstruct.constructFieldObjectField(false, targetIdOrList),
    filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepathOrList),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpathOrList
    ),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
  });
const targetList = mddocConstruct
  .constructFieldArray<PermissionItemInputTarget>()
  .setType(target);
const targetOrList = mddocConstruct
  .constructFieldOrCombination<PermissionItemInputTarget | PermissionItemInputTarget[]>()
  .setTypes([targetList, target]);

const resolvePermissionsTarget = mddocConstruct
  .constructFieldObject<ResolveEntityPermissionItemInputTarget>()
  .setName('ResolveEntityPermissionItemInputTarget')
  .setFields({
    targetId: mddocConstruct.constructFieldObjectField(false, targetIdOrList),
    filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepathOrList),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpathOrList
    ),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
  });
const resolvePermissionsTargetList = mddocConstruct
  .constructFieldArray<ResolveEntityPermissionItemInputTarget>()
  .setType(resolvePermissionsTarget);
const resolvePermissionsTargetOrList = mddocConstruct
  .constructFieldOrCombination<
    ResolveEntityPermissionItemInputTarget | ResolveEntityPermissionItemInputTarget[]
  >()
  .setTypes([resolvePermissionsTargetList, resolvePermissionsTarget]);

const deletePermissionItemTarget = mddocConstruct
  .constructFieldObject<DeletePermissionItemInputTarget>()
  .setName('DeleteDeletePermissionItemInputTarget')
  .setFields({
    targetId: mddocConstruct.constructFieldObjectField(false, targetIdOrList),
    filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepathOrList),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpathOrList
    ),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
  });
const deletePermissionItemTargetList = mddocConstruct
  .constructFieldArray<DeletePermissionItemInputTarget>()
  .setType(deletePermissionItemTarget);
const deletePermissionItemTargetOrList = mddocConstruct
  .constructFieldOrCombination<
    DeletePermissionItemInputTarget | DeletePermissionItemInputTarget[]
  >()
  .setTypes([deletePermissionItemTargetList, deletePermissionItemTarget]);

const deletePermissionItemInput = mddocConstruct
  .constructFieldObject<DeletePermissionItemInput>()
  .setName('DeletePermissionItemInput')
  .setFields({
    target: mddocConstruct.constructFieldObjectField(
      false,
      deletePermissionItemTargetOrList
    ),
    action: mddocConstruct.constructFieldObjectField(false, fReusables.actionOrList),
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
    target: mddocConstruct.constructFieldObjectField(true, targetOrList),
    access: mddocConstruct.constructFieldObjectField(true, grantAccess),
    entityId: mddocConstruct.constructFieldObjectField(true, entityIdOrList),
    action: mddocConstruct.constructFieldObjectField(true, fReusables.actionOrList),
  });

const resolvePermissionsItemInput = mddocConstruct
  .constructFieldObject<ResolveEntityPermissionItemInput>()
  .setName('ResolveEntityPermissionItemInput')
  .setFields({
    target: mddocConstruct.constructFieldObjectField(
      true,
      resolvePermissionsTargetOrList
    ),
    entityId: mddocConstruct.constructFieldObjectField(true, entityIdOrList),
    action: mddocConstruct.constructFieldObjectField(true, fReusables.actionOrList),
  });

const resolvedPermissionTarget = mddocConstruct
  .constructFieldObject<ResolvedEntityPermissionItemTarget>()
  .setName('ResolvedEntityPermissionItemTarget')
  .setFields({
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

const addPermissionItemsParams = mddocConstruct
  .constructFieldObject<AddPermissionItemsEndpointParams>()
  .setName('AddPermissionItemsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    items: mddocConstruct.constructFieldObjectField(true, newPermissionItemInputList),
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
    items: mddocConstruct.constructFieldObjectField(true, resolvedPermissionItemList),
  });
const deletePermissionItemsParams = mddocConstruct
  .constructFieldObject<DeletePermissionItemsEndpointParams>()
  .setName('DeletePermissionItemsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    items: mddocConstruct.constructFieldObjectField(true, deletePermissionItemInputList),
  });
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
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.multipleLongRunningJobResponseBody)
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
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(resolveEntityPermissionsResponseBody)
  .setName('ResolveEntityPermissionsEndpoint');

export const permissionItemMddocParts = {entityId, entityIdOrList, entityIdList};

import {indexArray} from 'softkave-js-utils';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
} from '../../contexts/semantic/types.js';
import {
  AssignedPermissionGroupMeta,
  PermissionGroup,
  PermissionGroupMatcher,
  PublicAssignedPermissionGroupMeta,
  PublicPermissionGroup,
} from '../../definitions/permissionGroups.js';
import {
  FimidaraPermissionAction,
  PermissionItem,
  PublicPermissionItem,
} from '../../definitions/permissionItem.js';
import {
  Agent,
  FimidaraResourceType,
  SessionAgent,
  kFimidaraResourceType,
} from '../../definitions/system.js';
import {appAssert} from '../../utils/assertion.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {convertToArray, getResourceId} from '../../utils/fns.js';
import {getResourceTypeFromId} from '../../utils/resource.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {InvalidRequestError, NotFoundError} from '../errors.js';
import {agentExtractor, workspaceResourceFields} from '../extractors.js';
import {checkResourcesBelongsToWorkspace} from '../resources/containerCheckFns.js';
import {INTERNAL_getResources} from '../resources/getResources.js';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems.js';

const permissionItemFields = getFields<PublicPermissionItem>({
  ...workspaceResourceFields,
  entityId: true,
  entityType: true,
  targetId: true,
  targetType: true,
  action: true,
  access: true,
});

export const permissionItemExtractor = makeExtract(permissionItemFields);
export const permissionItemListExtractor =
  makeListExtract(permissionItemFields);

export function throwPermissionItemNotFound() {
  throw kReuseableErrors.permissionItem.notFound();
}

export function getTargetType(data: {
  targetId?: string;
  targetType?: FimidaraResourceType;
}) {
  const targetType = data.targetType
    ? data.targetType
    : data.targetId
      ? getResourceTypeFromId(data.targetId)
      : null;
  appAssert(
    targetType,
    new InvalidRequestError('Target ID or target type must be present')
  );
  return targetType;
}

export function assertPermissionItem(
  item?: PermissionItem | null
): asserts item {
  appAssert(item, kReuseableErrors.permissionItem.notFound());
}

export async function getPermissionItemEntities(
  agent: SessionAgent,
  workspaceId: string,
  entityIds: string | string[]
) {
  let resources = await INTERNAL_getResources({
    agent,
    allowedTypes: [
      kFimidaraResourceType.User,
      kFimidaraResourceType.PermissionGroup,
      kFimidaraResourceType.AgentToken,
    ],
    workspaceId,
    inputResources: convertToArray(entityIds).map(entityId => ({
      resourceId: entityId,
      action: 'updatePermission',
    })),
    checkAuth: true,
    checkBelongsToWorkspace: true,
  });
  resources = await resourceListWithAssignedItems(workspaceId, resources, [
    kFimidaraResourceType.User,
  ]);
  checkResourcesBelongsToWorkspace(workspaceId, resources);
  return resources;
}

const assignedPermissionGroupsFields =
  getFields<PublicAssignedPermissionGroupMeta>({
    permissionGroupId: true,
    assignedAt: true,
    assignedBy: agentExtractor,
    assigneeId: true,
  });

export const assignedPermissionGroupsExtractor = makeExtract(
  assignedPermissionGroupsFields
);
export const assignedPermissionGroupsListExtractor = makeListExtract(
  assignedPermissionGroupsFields
);

const permissionGroupFields = getFields<PublicPermissionGroup>({
  ...workspaceResourceFields,
  name: true,
  description: true,
});

export const permissionGroupExtractor = makeExtract(permissionGroupFields);
export const permissionGroupListExtractor = makeListExtract(
  permissionGroupFields
);

export async function checkPermissionGroupAuthorization(
  agent: SessionAgent,
  permissionGroup: PermissionGroup,
  action: FimidaraPermissionAction,
  opts?: SemanticProviderOpParams
) {
  appAssert(
    permissionGroup.workspaceId,
    'PermissionGroup workspace ID not set'
  );
  await checkAuthorizationWithAgent({
    agent,
    opts,
    workspaceId: permissionGroup.workspaceId,
    target: {action, targetId: permissionGroup.resourceId},
  });

  return {agent, permissionGroup};
}

export async function checkPermissionGroupAuthorization02(
  agent: SessionAgent,
  id: string,
  action: FimidaraPermissionAction
) {
  const permissionGroup = await kSemanticModels
    .permissionGroup()
    .getOneById(id);
  assertPermissionGroup(permissionGroup);
  return checkPermissionGroupAuthorization(agent, permissionGroup, action);
}

export async function getPermissionGroupByMatcher(
  workspaceId: string,
  input: PermissionGroupMatcher,
  opts?: SemanticProviderOpParams
) {
  let permissionGroup: PermissionGroup | null = null;

  if (!input.permissionGroupId && !input.name) {
    throw new InvalidRequestError('Permission group ID or name is required');
  }

  if (input.permissionGroupId) {
    permissionGroup = await kSemanticModels
      .permissionGroup()
      .getOneById(input.permissionGroupId, opts);
  } else if (input.name) {
    permissionGroup = await kSemanticModels
      .permissionGroup()
      .getByName(workspaceId, input.name, opts);
  }

  appAssert(
    permissionGroup,
    new NotFoundError('PermissionGroup does not exist')
  );
  return {permissionGroup};
}

export async function checkPermissionGroupsExist(
  workspaceId: string,
  idList: string[],
  opts?: SemanticProviderMutationParams
) {
  // TODO: use exists with $or or implement bulk ops
  const permissionGroups = await kSemanticModels
    .permissionGroup()
    .getManyByWorkspaceAndIdList({workspaceId, resourceIdList: idList}, opts);

  if (idList.length !== permissionGroups.length) {
    const map = indexArray(permissionGroups, {indexer: getResourceId});
    idList.forEach(id =>
      appAssert(map[id], kReuseableErrors.permissionGroup.notFound(id))
    );
  }
}

export function mergePermissionGroupsWithInput(
  agent: Agent,
  entityId: string,
  permissionGroups: AssignedPermissionGroupMeta[],
  input: string[]
) {
  const inputMap = indexArray(input);
  return permissionGroups
    .filter(item => !inputMap[item.permissionGroupId])
    .concat(
      input.map(id => ({
        permissionGroupId: id,
        assignedAt: getTimestamp(),
        assignedBy: agent,
        assigneeEntityId: entityId,
      }))
    );
}

export function throwPermissionGroupNotFound() {
  throw new NotFoundError('PermissionGroup permissions group not found');
}

export function assertPermissionGroup(
  permissionGroup?: PermissionGroup | null
): asserts permissionGroup {
  appAssert(permissionGroup, kReuseableErrors.permissionGroup.notFound());
}
